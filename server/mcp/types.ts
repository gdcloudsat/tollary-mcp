/**
 * Model Context Protocol (MCP) Official Protocol Types (2024-11-05 Specification)
 * https://modelcontextprotocol.io/
 */

export interface JsonRpcRequest<T = any> {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: T;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// Standard JSON-RPC 2.0 Error Codes
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Tollary Protocol Extensions
  PAYMENT_REQUIRED: -32402,
  REPLAY_NONCE_CONFLICT: -32409,
  SERVER_NOT_FOUND: -32001,
  TOOL_NOT_FOUND: -32002,
} as const;

export interface McpServerInfo {
  name: string;
  version: string;
}

export interface McpServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: Record<string, any>;
}

export interface McpClientCapabilities {
  roots?: {
    listChanged?: boolean;
  };
  sampling?: Record<string, any>;
}

export interface InitializeParams {
  protocolVersion: string;
  capabilities: McpClientCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: McpServerCapabilities;
  serverInfo: McpServerInfo;
  instructions?: string;
}

export interface McpToolInputSchema {
  type: 'object';
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: McpToolInputSchema;
  pricing?: {
    model: 'free' | 'fixed_per_call' | 'tiered';
    unitPriceUsd: number;
    currency: string;
  };
}

export interface CallToolParams {
  name: string;
  arguments?: Record<string, any>;
}

export interface McpContentItem {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface CallToolResult {
  content: McpContentItem[];
  isError?: boolean;
  _meta?: Record<string, any>;
}

export interface RegisteredMcpServer {
  id: string;
  name: string;
  provider: {
    id: string;
    name: string;
    verified: boolean;
  };
  transportType: 'streamable_http' | 'http_sse';
  protocolVersion: string;
  capabilities: McpServerCapabilities;
  tools: Map<string, McpTool>;
  executeTool: (toolName: string, args: Record<string, any>) => Promise<CallToolResult>;
}
