/**
 * x402 Payment Required Protocol & Financial Ledger Types
 * Specification Reference: https://www.x402.org/
 */

export interface PaymentRequirement {
  costUsd: number;
  costString: string;
  asset: 'USDC' | 'USD';
  chain: 'Base' | 'Solana';
  recipientAddress: string;
  nonce: string;
  facilitatorUrl: string;
  validUntil: string;
}

export interface PaymentProof {
  signature: string;
  nonce: string;
  payerAddress?: string;
  facilitatorTxHash?: string;
  amount: number;
  asset: string;
  timestamp: string;
}

export interface FacilitatorVerificationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  txHash?: string;
  settledAmount?: number;
}

export interface LedgerTransaction {
  id: string;
  paymentNonce: string;
  agentId: string;
  providerId: string;
  serverId: string;
  toolName: string;
  grossAmount: number;
  platformFee: number; // 5% platform fee
  providerNet: number;
  status: 'SETTLED' | 'REFUNDED_COMPENSATING' | 'VOIDED';
  facilitator: string;
  txHash?: string;
  createdAt: string;
}
