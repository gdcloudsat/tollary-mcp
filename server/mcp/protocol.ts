import {
  JsonRpcRequest,
  JsonRpcResponse,
  JSON_RPC_ERRORS,
  InitializeParams,
  InitializeResult,
  CallToolParams,
  RegisteredMcpServer,
} from './types';

export class McpProtocolProcessor {
  /**
   * Process a single incoming JSON-RPC 2.0 request for a registered MCP server
   */
  public async handleRequest(
    server: RegisteredMcpServer,
    rpcReq: JsonRpcRequest
  ): Promise<JsonRpcResponse | null> {
    const { id, method, params } = rpcReq;

    // Check if this is a notification (no ID)
    const isNotification = id === undefined || id === null;

    try {
      switch (method) {
        case 'initialize': {
          const initParams = (params || {}) as InitializeParams;
          const clientVersion = initParams.protocolVersion || '2024-11-05';

          const result: InitializeResult = {
            protocolVersion: '2024-11-05',
            capabilities: server.capabilities,
            serverInfo: {
              name: `tollary-gateway/${server.name}`,
              version: '1.0.0',
            },
            instructions: 'Tollary Managed MCP Gateway. Tools are rate-limited and subject to x402 payment policies.',
          };

          return {
            jsonrpc: '2.0',
            id: id ?? null,
            result,
          };
        }

        case 'notifications/initialized': {
          // Client acknowledged completion of handshake
          return null; // Notifications produce no response
        }

        case 'ping': {
          return {
            jsonrpc: '2.0',
            id: id ?? null,
            result: {},
          };
        }

        case 'tools/list': {
          const toolsArray = Array.from(server.tools.values()).map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            _tollary_meta: {
              provider: server.provider.name,
              verified: server.provider.verified,
              pricing: t.pricing || { model: 'free', unitPriceUsd: 0, currency: 'USDC' },
            },
          }));

          return {
            jsonrpc: '2.0',
            id: id ?? null,
            result: {
              tools: toolsArray,
            },
          };
        }

        case 'tools/call': {
          const callParams = (params || {}) as CallToolParams;
          if (!callParams.name) {
            return {
              jsonrpc: '2.0',
              id: id ?? null,
              error: {
                code: JSON_RPC_ERRORS.INVALID_PARAMS,
                message: "Missing required parameter 'name' in tools/call.",
              },
            };
          }

          const tool = server.tools.get(callParams.name);
          if (!tool) {
            return {
              jsonrpc: '2.0',
              id: id ?? null,
              error: {
                code: JSON_RPC_ERRORS.TOOL_NOT_FOUND,
                message: `Tool '${callParams.name}' does not exist on server '${server.id}'.`,
              },
            };
          }

          // Validate required schema properties
          const args = callParams.arguments || {};
          if (tool.inputSchema.required && Array.isArray(tool.inputSchema.required)) {
            for (const requiredKey of tool.inputSchema.required) {
              if (args[requiredKey] === undefined || args[requiredKey] === null) {
                return {
                  jsonrpc: '2.0',
                  id: id ?? null,
                  error: {
                    code: JSON_RPC_ERRORS.INVALID_PARAMS,
                    message: `Missing required argument '${requiredKey}' for tool '${tool.name}'.`,
                  },
                };
              }
            }
          }

          // Execute tool through server's provider engine
          const toolResult = await server.executeTool(callParams.name, args);

          return {
            jsonrpc: '2.0',
            id: id ?? null,
            result: toolResult,
          };
        }

        case 'resources/list': {
          return {
            jsonrpc: '2.0',
            id: id ?? null,
            result: { resources: [] },
          };
        }

        case 'prompts/list': {
          return {
            jsonrpc: '2.0',
            id: id ?? null,
            result: { prompts: [] },
          };
        }

        case 'notifications/cancelled': {
          return null;
        }

        default: {
          if (isNotification) return null;
          return {
            jsonrpc: '2.0',
            id: id ?? null,
            error: {
              code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
              message: `The method '${method}' is not supported by MCP server '${server.id}'.`,
            },
          };
        }
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: {
          code: JSON_RPC_ERRORS.INTERNAL_ERROR,
          message: err.message || 'Internal MCP gateway execution error.',
        },
      };
    }
  }
}

export const mcpProcessor = new McpProtocolProcessor();
