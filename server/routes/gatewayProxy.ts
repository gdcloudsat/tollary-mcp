import { Router, Request, Response } from 'express';
import { defaultFacilitator } from '../x402/facilitator';
import { replayGuard } from '../x402/replayGuard';
import { financialLedger } from '../x402/ledger';
import { controlStore } from '../control/store';
import { PaymentProof } from '../x402/types';

export const gatewayProxyRouter = Router();

interface RestEndpointConfig {
  provider: string;
  service: string;
  path: string;
  method: string;
  priceUsd: number;
  upstreamUrl: string;
  mockHandler: (body: any, query: any) => any;
}

// Registry of monetized REST endpoints
const restCatalog: Map<string, RestEndpointConfig> = new Map();

function registerRestEndpoint(config: RestEndpointConfig) {
  const key = `${config.provider}/${config.service}/${config.path}`;
  restCatalog.set(key, config);
}

// Seed sample REST endpoints
registerRestEndpoint({
  provider: 'acme-fintech',
  service: 'company',
  path: 'search',
  method: 'GET',
  priceUsd: 0.015,
  upstreamUrl: 'https://internal-api.acme.corp/v2/companies/search',
  mockHandler: (_body, query) => ({
    query: query.q || 'Acme Corp',
    results: [
      {
        ein: '12-3456789',
        legalName: 'Acme Corporation Inc.',
        state: 'Delaware',
        incorporationYear: 2012,
        status: 'Active Good Standing',
        cik: '0001584921',
      },
    ],
  }),
});

registerRestEndpoint({
  provider: 'acme-fintech',
  service: 'gst',
  path: 'validate',
  method: 'GET',
  priceUsd: 0.02,
  upstreamUrl: 'https://internal-api.acme.corp/v1/gst/check',
  mockHandler: (_body, query) => ({
    gstin: query.gstin || '27AABCU9603R1ZM',
    valid: true,
    tradeName: 'Acme Cloud Solutions Private Limited',
    state: 'Maharashtra',
  }),
});

registerRestEndpoint({
  provider: 'dataforge',
  service: 'document',
  path: 'extract',
  method: 'POST',
  priceUsd: 0.005,
  upstreamUrl: 'https://api.dataforge.internal/doc/parse',
  mockHandler: (body) => ({
    sourceUrl: body.url || 'https://example.com/doc.pdf',
    extractedCharacters: 8420,
    language: 'en',
    parsedJson: {
      title: 'Quarterly Cloud Systems Report',
      sectionCount: 4,
    },
  }),
});

/**
 * Handle generic REST API proxying with x402 payment interception
 * Pattern: /g/:provider/:service/:subpath(*)
 */
gatewayProxyRouter.all('/:provider/:service/:path(*)?', async (req: Request, res: Response) => {
  const { provider, service, path: rawPath } = req.params;
  const path = rawPath || '';
  const key = `${provider}/${service}/${path}`;
  const endpoint = restCatalog.get(key);

  if (!endpoint) {
    res.status(404).json({
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `Monetized REST route '/g/${key}' is not configured on this gateway.`,
        availableRoutes: Array.from(restCatalog.keys()).map((k) => `/g/${k}`),
      },
    });
    return;
  }

  const price = endpoint.priceUsd;

  // Check payment if endpoint is priced
  if (price > 0) {
    const paymentSig = (req.headers['payment-signature'] || req.headers['x-payment-signature'] || '') as string;
    const paymentNonce = (req.headers['payment-nonce'] || req.headers['x-payment-nonce'] || '') as string;

    // Unpaid -> Return HTTP 402 challenge
    if (!paymentSig) {
      const requirement = defaultFacilitator.generateRequirements(`${service}/${path}`, price);

      res.setHeader('X-Payment-Cost', requirement.costString);
      res.setHeader('X-Payment-Asset', requirement.asset);
      res.setHeader('X-Payment-Chain', requirement.chain);
      res.setHeader('X-Payment-Recipient', requirement.recipientAddress);
      res.setHeader('X-Payment-Nonce', requirement.nonce);
      res.setHeader('X-Payment-Facilitator', requirement.facilitatorUrl);
      res.setHeader('X-Payment-Valid-Until', requirement.validUntil);

      res.status(402).json({
        error: {
          code: 'PAYMENT_REQUIRED',
          message: `Payment Required for REST endpoint '/g/${key}' ($${price} USDC).`,
          settlement: requirement,
        },
      });
      return;
    }

    // Payment proof present -> Replay Guard Check
    const nonceToVerify = paymentNonce || `nonce_rest_${paymentSig.substring(0, 16)}`;
    if (!replayGuard.acquireNonce(nonceToVerify)) {
      res.setHeader('X-Tollary-Security', 'DUPLICATE_PAYMENT_NONCE');
      res.status(409).json({
        error: {
          code: 'REPLAY_NONCE_CONFLICT',
          message: `Conflict: Payment nonce '${nonceToVerify}' has already been spent.`,
        },
      });
      return;
    }

    // Facilitator verification
    const requirement = defaultFacilitator.generateRequirements(`${service}/${path}`, price);
    const proof: PaymentProof = {
      signature: paymentSig,
      nonce: nonceToVerify,
      amount: price,
      asset: 'USDC',
      timestamp: new Date().toISOString(),
    };

    const verification = await defaultFacilitator.verifyPaymentProof(proof, requirement);
    if (!verification.valid) {
      replayGuard.releaseNonce(nonceToVerify);
      res.setHeader('X-Tollary-Security', verification.errorCode || 'INVALID_SIGNATURE');
      res.status(403).json({
        error: {
          code: 'INVALID_PAYMENT_SIGNATURE',
          message: verification.errorMessage || 'Forbidden: Signature verification failed.',
        },
      });
      return;
    }

    // Settle & Record Ledger
    const settlement = await defaultFacilitator.settlePayment(proof, price);
    const ledgerRow = financialLedger.recordSettlement({
      paymentNonce: nonceToVerify,
      providerId: `prov_${provider}`,
      serverId: `rest_${service}`,
      toolName: `${service}/${path}`,
      grossAmount: price,
      facilitator: defaultFacilitator.name,
      txHash: settlement.txHash,
    });

    // Record Telemetry
    controlStore.recordUsage({
      agentId: 'rest_client',
      tenantId: 'org_default',
      providerId: `prov_${provider}`,
      serverId: `rest_${service}`,
      toolName: `${service}/${path}`,
      durationMs: 42,
      status: 'success',
      costUsd: price,
    });

    res.setHeader('X-Payment-Settlement', 'CONFIRMED_BASE_USDC');
    res.setHeader('X-Payment-Tx-Hash', settlement.txHash);
    res.setHeader('X-Tollary-Transaction-ID', ledgerRow.id);
  }

  // Execute Upstream Proxy Handler
  const output = endpoint.mockHandler(req.body, req.query);
  res.status(200).json({
    status: 'success',
    route: `/g/${key}`,
    meteredCostUsd: price,
    data: output,
  });
});
