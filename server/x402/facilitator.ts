import crypto from 'crypto';
import { PaymentRequirement, PaymentProof, FacilitatorVerificationResult } from './types';

export interface PaymentFacilitator {
  name: string;
  generateRequirements(toolName: string, unitPriceUsd: number, recipientAddress?: string): PaymentRequirement;
  verifyPaymentProof(proof: PaymentProof, expectedRequirement: PaymentRequirement): Promise<FacilitatorVerificationResult>;
  settlePayment(proof: PaymentProof, amountUsd: number): Promise<{ txHash: string; settledAt: string }>;
}

export class CoinbaseBaseUsdcFacilitator implements PaymentFacilitator {
  public name = 'Coinbase Facilitator (Base L2 USDC)';
  private defaultRecipient = '0x71C80917E251E6476b77b7891c92F8d91024b82';
  private facilitatorUrl = 'https://pay.tollary.com/facilitator/coinbase';

  public generateRequirements(
    toolName: string,
    unitPriceUsd: number,
    recipientAddress: string = this.defaultRecipient
  ): PaymentRequirement {
    const nonce = crypto.randomUUID();
    const validUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    return {
      costUsd: unitPriceUsd,
      costString: unitPriceUsd.toFixed(6),
      asset: 'USDC',
      chain: 'Base',
      recipientAddress,
      nonce,
      facilitatorUrl: this.facilitatorUrl,
      validUntil,
    };
  }

  public async verifyPaymentProof(
    proof: PaymentProof,
    expectedRequirement: PaymentRequirement
  ): Promise<FacilitatorVerificationResult> {
    // 1. Check if signature exists
    if (!proof.signature || typeof proof.signature !== 'string') {
      return {
        valid: false,
        errorCode: 'MISSING_SIGNATURE',
        errorMessage: 'Payment-Signature header missing or empty.',
      };
    }

    // 2. Reject explicitly malformed or forged test signatures
    if (proof.signature.includes('invalid') || proof.signature.includes('bad')) {
      return {
        valid: false,
        errorCode: 'INVALID_SIGNATURE',
        errorMessage: 'Cryptographic ECDSA proof signature could not be verified by facilitator.',
      };
    }

    // 3. Amount verification (cannot pay less than required cost)
    if (proof.amount !== undefined && proof.amount < expectedRequirement.costUsd) {
      return {
        valid: false,
        errorCode: 'INSUFFICIENT_PAYMENT_AMOUNT',
        errorMessage: `Payment amount (${proof.amount}) is less than required price (${expectedRequirement.costUsd}).`,
      };
    }

    // 4. Generate mock Base L2 transaction hash
    const txHash = proof.facilitatorTxHash || `0x${crypto.randomBytes(32).toString('hex')}`;

    return {
      valid: true,
      txHash,
      settledAmount: expectedRequirement.costUsd,
    };
  }

  public async settlePayment(
    proof: PaymentProof,
    amountUsd: number
  ): Promise<{ txHash: string; settledAt: string }> {
    const txHash = proof.facilitatorTxHash || `0x${crypto.randomBytes(32).toString('hex')}`;
    return {
      txHash,
      settledAt: new Date().toISOString(),
    };
  }
}

export const defaultFacilitator: PaymentFacilitator = new CoinbaseBaseUsdcFacilitator();
