/**
 * Tollary Master Architecture & Discovery Data Types
 */

export type TabType = 
  | 'summary'
  | 'prd'
  | 'architecture'
  | 'mcp-protocol'
  | 'x402-ledger'
  | 'database-er'
  | 'threat-model'
  | 'cost-calculator'
  | 'api-contracts'
  | 'founder-decisions';

export interface ServiceResponsibility {
  name: string;
  plane: 'Control Plane' | 'Data Plane';
  responsibilities: string[];
  techStack: string;
  latencyBudget: string;
  resiliency: string;
}

export interface DbTableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isUnique?: boolean;
  nullable?: boolean;
  references?: string;
  description: string;
}

export interface DbTable {
  name: string;
  category: 'Identity & Tenancy' | 'Provider & Registry' | 'Financial & Ledger' | 'Telemetry';
  description: string;
  columns: DbTableColumn[];
}

export interface ThreatItem {
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege' | 'SSRF' | 'Prompt Injection';
  vector: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  mitigation: string;
  component: string;
}

export interface SampleTool {
  id: string;
  name: string;
  provider: string;
  verified: boolean;
  protocol: 'mcp' | 'rest';
  category: string;
  description: string;
  pricing: {
    model: 'free' | 'fixed' | 'tiered';
    unitPriceUsd: number;
    currency: string;
  };
  inputSchema: Record<string, any>;
  sampleResponse: Record<string, any>;
  latencyMs: number;
}

export interface FounderDecision {
  id: string;
  title: string;
  category: string;
  urgency: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  selectedOption: string;
  options: {
    id: string;
    label: string;
    recommended: boolean;
    pros: string[];
    cons: string[];
    architecturalNotes: string;
  }[];
}
