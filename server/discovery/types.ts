/**
 * Tollary Agent Discovery Search Engine Types
 */

export interface DiscoverySearchParams {
  query?: string;
  protocol?: 'mcp' | 'rest' | 'all';
  maxPriceUsd?: number;
  verifiedOnly?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface DiscoverySearchResultItem {
  id: string;
  name: string;
  protocol: 'mcp' | 'rest';
  category: string;
  description: string;
  provider: {
    id: string;
    name: string;
    verified: boolean;
    reputationScore: number;
  };
  mcpServer?: {
    id: string;
    gatewayUrl: string;
    transportType: string;
    protocolVersion: string;
  };
  restEndpoint?: {
    gatewayUrl: string;
    method: string;
  };
  inputSchema: Record<string, any>;
  pricing: {
    model: 'free' | 'fixed_per_call' | 'tiered';
    unitPriceUsd: number;
    currency: string;
  };
  telemetry: {
    p99LatencyMs: number;
    successRate30d: number;
  };
  score: number;
}

export interface DiscoverySearchResponse {
  total: number;
  tookMs: number;
  query: string;
  filters: {
    protocol: string;
    maxPriceUsd?: number;
    verifiedOnly?: boolean;
    category?: string;
  };
  results: DiscoverySearchResultItem[];
  _safetyContext: string;
}
