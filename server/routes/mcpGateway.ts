import { Router, Request, Response } from 'express';
import { mcpRegistry } from '../mcp/registry';
import { mcpProcessor } from '../mcp/protocol';
import { JsonRpcRequest, JSON_RPC_ERRORS, CallToolParams } from '../mcp/types';
import { defaultFacilitator } from '../x402/facilitator';
import { replayGuard } from '../x402/replayGuard';
import { financialLedger } from '../x402/ledger';
import { PaymentProof } from '../x402/types';

export const mcpGatewayRouter = Router();

/**
 * GET /mcp - Catalog of all active MCP servers managed by the gateway
 */
mcpGatewayRouter.get('/', (_req: Request, res: Response) => {
  const servers = mcpRegistry.getAllServers().map((s) => ({
    id: s.id,
    name: s.name,
    provider: s.provider,
    protocolVersion: s.protocolVersion,
    transportType: s.transportType,
    toolsCount: s.tools.size,
    tools: Array.from(s.tools.keys()),
    endpoint: `/mcp/${s.id}`,
  }));

  res.status(200).json({
    total: servers.length,
    servers,
  });
});

/**
 * GET /mcp/:serverId - Server capability probe and health check
 */
mcpGatewayRouter.get('/:serverId', (req: Request, res: Response) => {
  const { serverId } = req.params;
  const server = mcpRegistry.getServer(serverId);

  if (!server) {
    res.status(404).json({
      error: {
        code: JSON_RPC_ERRORS.SERVER_NOT_FOUND,
        message: `MCP server '${serverId}' not found on this gateway.`,
      },
    });
    return;
  }

  res.status(200).json({
    id: server.id,
    name: server.name,
    provider: server.provider,
    protocolVersion: server.protocolVersion,
    transportType: server.transportType,
    capabilities: server.capabilities,
    tools: Array.from(server.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      pricing: t.pricing,
    })),
  });
});

/**
 * POST /mcp/:serverId - Primary Model Context Protocol (Streamable HTTP) Gateway Endpoint
 * with native x402 payment interception and cryptographic proof verification.
 */
mcpGatewayRouter.post('/:serverId', async (req: Request, res: Response) => {
  const { serverId } = req.params;
  const server = mcpRegistry.getServer(serverId);

  if (!server) {
    res.status(404).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: JSON_RPC_ERRORS.SERVER_NOT_FOUND,
        message: `MCP server '${serverId}' not found on this gateway.`,
      },
    });
    return;
  }

  const body = req.body;

  // Validate JSON-RPC 2.0 structure
  if (!body || typeof body !== 'object') {
    res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: JSON_RPC_ERRORS.PARSE_ERROR,
        message: 'Invalid JSON-RPC 2.0 payload format.',
      },
    });
    return;
  }

  // Handle batch requests vs single request
  if (Array.isArray(body)) {
    if (body.length === 0) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: JSON_RPC_ERRORS.INVALID_REQUEST,
          message: 'Empty JSON-RPC batch array.',
        },
      });
      return;
    }

    const responses = [];
    for (const singleReq of body) {
      if (!singleReq || singleReq.jsonrpc !== '2.0' || !singleReq.method) {
        responses.push({
          jsonrpc: '2.0',
          id: singleReq?.id ?? null,
          error: {
            code: JSON_RPC_ERRORS.INVALID_REQUEST,
            message: 'Invalid JSON-RPC 2.0 request in batch.',
          },
        });
        continue;
      }
      const response = await mcpProcessor.handleRequest(server, singleReq as JsonRpcRequest);
      if (response) {
        responses.push(response);
      }
    }

    res.status(200).json(responses);
    return;
  }

  // Single JSON-RPC 2.0 request
  const rpcReq = body as JsonRpcRequest;
  if (rpcReq.jsonrpc !== '2.0' || !rpcReq.method) {
    res.status(400).json({
      jsonrpc: '2.0',
      id: rpcReq.id ?? null,
      error: {
        code: JSON_RPC_ERRORS.INVALID_REQUEST,
        message: "Invalid Request: 'jsonrpc' must be exactly '2.0' and 'method' is required.",
      },
    });
    return;
  }

  // =========================================================================
  // x402 PAYMENT INTERCEPTION LAYER
  // Free discovery operations (initialize, tools/list, ping) bypass payment checks.
  // Monetized execution (tools/call) triggers price evaluation and proof checks.
  // =========================================================================
  if (rpcReq.method === 'tools/call') {
    const callParams = (rpcReq.params || {}) as CallToolParams;
    const targetTool = callParams.name ? server.tools.get(callParams.name) : undefined;

    // Check if tool is priced (> $0.00)
    if (targetTool && targetTool.pricing && targetTool.pricing.unitPriceUsd > 0) {
      const toolPrice = targetTool.pricing.unitPriceUsd;

      // Extract x402 headers
      const paymentSignature = (req.headers['payment-signature'] ||
        req.headers['x-payment-signature'] ||
        '') as string;
      const paymentNonce = (req.headers['payment-nonce'] ||
        req.headers['x-payment-nonce'] ||
        '') as string;

      // SCENARIO 1: MISSING PAYMENT -> Issue HTTP 402 Challenge
      if (!paymentSignature) {
        const requirement = defaultFacilitator.generateRequirements(targetTool.name, toolPrice);

        res.setHeader('X-Payment-Cost', requirement.costString);
        res.setHeader('X-Payment-Asset', requirement.asset);
        res.setHeader('X-Payment-Chain', requirement.chain);
        res.setHeader('X-Payment-Recipient', requirement.recipientAddress);
        res.setHeader('X-Payment-Nonce', requirement.nonce);
        res.setHeader('X-Payment-Facilitator', requirement.facilitatorUrl);
        res.setHeader('X-Payment-Valid-Until', requirement.validUntil);

        res.status(402).json({
          jsonrpc: '2.0',
          id: rpcReq.id ?? null,
          error: {
            code: JSON_RPC_ERRORS.PAYMENT_REQUIRED,
            message: `Payment Required for tool '${targetTool.name}' execution ($${toolPrice} USDC).`,
            data: {
              tool: targetTool.name,
              costUsd: toolPrice,
              settlement: requirement,
            },
          },
        });
        return;
      }

      // SCENARIO 2: PAYMENT PROOF PRESENT -> Verify Nonce & Cryptographic Attestation
      const nonceToVerify = paymentNonce || `nonce_${paymentSignature.substring(0, 16)}`;

      // 1. Replay Guard Check (Atomic SETNX simulation)
      const nonceAcquired = replayGuard.acquireNonce(nonceToVerify);
      if (!nonceAcquired) {
        res.setHeader('X-Tollary-Security', 'DUPLICATE_PAYMENT_NONCE');
        res.status(409).json({
          jsonrpc: '2.0',
          id: rpcReq.id ?? null,
          error: {
            code: JSON_RPC_ERRORS.REPLAY_NONCE_CONFLICT,
            message: `Conflict: Payment nonce '${nonceToVerify}' has already been spent. Double-spend blocked.`,
          },
        });
        return;
      }

      // 2. Facilitator Signature Attestation
      const requirement = defaultFacilitator.generateRequirements(targetTool.name, toolPrice);
      const proof: PaymentProof = {
        signature: paymentSignature,
        nonce: nonceToVerify,
        amount: toolPrice,
        asset: 'USDC',
        timestamp: new Date().toISOString(),
      };

      const verification = await defaultFacilitator.verifyPaymentProof(proof, requirement);

      if (!verification.valid) {
        // Invalidate nonce so client can retry with valid proof
        replayGuard.releaseNonce(nonceToVerify);

        res.setHeader('X-Tollary-Security', verification.errorCode || 'INVALID_SIGNATURE');
        res.status(403).json({
          jsonrpc: '2.0',
          id: rpcReq.id ?? null,
          error: {
            code: -32403,
            message: verification.errorMessage || 'Forbidden: Cryptographic payment proof signature could not be verified.',
          },
        });
        return;
      }

      // 3. Authorized -> Proceed to Tool Execution
      try {
        const response = await mcpProcessor.handleRequest(server, rpcReq);

        // Check if execution failed internally
        if (response?.error) {
          // Compensating Transaction: Execution failed upstream; abort settlement!
          financialLedger.recordCompensatingRefund({
            paymentNonce: nonceToVerify,
            providerId: server.provider.id,
            serverId: server.id,
            toolName: targetTool.name,
            grossAmount: toolPrice,
            facilitator: defaultFacilitator.name,
            reason: response.error.message,
          });

          res.setHeader('X-Payment-Refund', 'COMPENSATING_REFUND_ISSUED');
          res.status(502).json(response);
          return;
        }

        // 4. Execution Succeeded -> Finalize Settlement & Record Ledger Row
        const settlement = await defaultFacilitator.settlePayment(proof, toolPrice);
        const ledgerRow = financialLedger.recordSettlement({
          paymentNonce: nonceToVerify,
          providerId: server.provider.id,
          serverId: server.id,
          toolName: targetTool.name,
          grossAmount: toolPrice,
          facilitator: defaultFacilitator.name,
          txHash: settlement.txHash,
        });

        res.setHeader('X-Payment-Settlement', 'CONFIRMED_BASE_USDC');
        res.setHeader('X-Payment-Tx-Hash', settlement.txHash);
        res.setHeader('X-Tollary-Transaction-ID', ledgerRow.id);

        res.status(200).json(response);
        return;
      } catch (execErr: any) {
        // Compensating refund on unexpected crash
        financialLedger.recordCompensatingRefund({
          paymentNonce: nonceToVerify,
          providerId: server.provider.id,
          serverId: server.id,
          toolName: targetTool.name,
          grossAmount: toolPrice,
          facilitator: defaultFacilitator.name,
          reason: execErr.message || 'Execution exception',
        });

        res.setHeader('X-Payment-Refund', 'COMPENSATING_REFUND_ISSUED');
        res.status(504).json({
          jsonrpc: '2.0',
          id: rpcReq.id ?? null,
          error: {
            code: JSON_RPC_ERRORS.INTERNAL_ERROR,
            message: 'Gateway Timeout: Provider execution failed. Payment has been refunded.',
          },
        });
        return;
      }
    }
  }

  // =========================================================================
  // STANDARD FREE MCP DISPATCH (initialize, tools/list, free tools)
  // =========================================================================
  const acceptHeader = req.headers.accept || '';
  const isEventStream = acceptHeader.includes('text/event-stream');

  if (isEventStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await mcpProcessor.handleRequest(server, rpcReq);
    if (response) {
      res.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
    }
    res.end();
    return;
  }

  const response = await mcpProcessor.handleRequest(server, rpcReq);
  if (!response) {
    res.status(204).end();
    return;
  }

  res.status(200).json(response);
});
