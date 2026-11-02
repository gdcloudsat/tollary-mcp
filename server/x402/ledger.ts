import crypto from 'crypto';
import { LedgerTransaction } from './types';

export class FinancialLedger {
  private transactions: LedgerTransaction[] = [];
  private platformFeeRate = 0.05; // 5% platform take-rate

  constructor() {
    this.seedSampleLedger();
  }

  /**
   * Commit a finalized settled transaction to the immutable ledger
   */
  public recordSettlement(params: {
    paymentNonce: string;
    agentId?: string;
    providerId: string;
    serverId: string;
    toolName: string;
    grossAmount: number;
    facilitator: string;
    txHash?: string;
  }): LedgerTransaction {
    const gross = Math.round(params.grossAmount * 1_000_000) / 1_000_000;
    const fee = Math.round(gross * this.platformFeeRate * 1_000_000) / 1_000_000;
    const net = Math.round((gross - fee) * 1_000_000) / 1_000_000;

    const tx: LedgerTransaction = {
      id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
      paymentNonce: params.paymentNonce,
      agentId: params.agentId || 'anonymous-agent',
      providerId: params.providerId,
      serverId: params.serverId,
      toolName: params.toolName,
      grossAmount: gross,
      platformFee: fee,
      providerNet: net,
      status: 'SETTLED',
      facilitator: params.facilitator,
      txHash: params.txHash,
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(tx);
    return tx;
  }

  /**
   * Record a compensating transaction if execution fails after authorization
   */
  public recordCompensatingRefund(params: {
    paymentNonce: string;
    agentId?: string;
    providerId: string;
    serverId: string;
    toolName: string;
    grossAmount: number;
    facilitator: string;
    reason: string;
  }): LedgerTransaction {
    const tx: LedgerTransaction = {
      id: `tx_comp_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
      paymentNonce: params.paymentNonce,
      agentId: params.agentId || 'anonymous-agent',
      providerId: params.providerId,
      serverId: params.serverId,
      toolName: params.toolName,
      grossAmount: params.grossAmount,
      platformFee: 0,
      providerNet: 0,
      status: 'REFUNDED_COMPENSATING',
      facilitator: params.facilitator,
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(tx);
    return tx;
  }

  public getTransactions(limit: number = 50): LedgerTransaction[] {
    return this.transactions.slice(0, limit);
  }

  public getTotals() {
    let totalGross = 0;
    let totalFees = 0;
    let totalNet = 0;

    for (const tx of this.transactions) {
      if (tx.status === 'SETTLED') {
        totalGross += tx.grossAmount;
        totalFees += tx.platformFee;
        totalNet += tx.providerNet;
      }
    }

    return {
      count: this.transactions.length,
      totalGross: Math.round(totalGross * 1_000_000) / 1_000_000,
      totalFees: Math.round(totalFees * 1_000_000) / 1_000_000,
      totalNet: Math.round(totalNet * 1_000_000) / 1_000_000,
    };
  }

  private seedSampleLedger(): void {
    this.recordSettlement({
      paymentNonce: '4f3a8b21-89d2-4e55-bc11-a89e47260cf1',
      agentId: 'agent_crawler_alpha',
      providerId: 'prov_acme',
      serverId: 'srv_fintech_mcp',
      toolName: 'gst_validator_pro',
      grossAmount: 0.02,
      facilitator: 'Coinbase Base USDC',
      txHash: '0x8a91b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    });
  }
}

export const financialLedger = new FinancialLedger();
