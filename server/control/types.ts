/**
 * Control Plane Entity & Management Types
 */

export interface ProviderEntity {
  id: string;
  name: string;
  legalEntityName: string;
  contactEmail: string;
  payoutAddress: string;
  verified: boolean;
  reputationScore: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  serverCount: number;
  toolCount: number;
}

export interface McpServerRegistrationInput {
  name: string;
  providerId: string;
  baseUrl: string;
  transportType?: 'streamable_http' | 'http_sse';
  authToken?: string;
  initialTools?: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    priceUsd?: number;
  }>;
}

export interface PricingRuleEntity {
  id: string;
  serverId: string;
  toolName: string;
  pricingModel: 'free' | 'fixed_per_call' | 'tiered';
  unitPriceUsd: number;
  currency: string;
  effectiveFrom: string;
  status: 'active' | 'archived';
}

export interface UsageMetricRecord {
  id: string;
  timestamp: string;
  agentId: string;
  tenantId: string;
  providerId: string;
  serverId: string;
  toolName: string;
  durationMs: number;
  status: 'success' | 'failed' | 'payment_required';
  costUsd: number;
}
