import { Router, Request, Response } from 'express';
import { financialLedger } from '../x402/ledger';

export const transactionsRouter = Router();

/**
 * GET /v1/transactions - List recent settled and compensating transactions
 */
transactionsRouter.get('/transactions', (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const transactions = financialLedger.getTransactions(limit);
  const totals = financialLedger.getTotals();

  res.status(200).json({
    totalCount: totals.count,
    grossVolumeUsd: totals.totalGross,
    platformRevenueUsd: totals.totalFees,
    providerPayoutsUsd: totals.totalNet,
    transactions,
  });
});

/**
 * GET /v1/transactions/totals - Financial aggregates and fee breakdowns
 */
transactionsRouter.get('/transactions/totals', (_req: Request, res: Response) => {
  res.status(200).json(financialLedger.getTotals());
});
