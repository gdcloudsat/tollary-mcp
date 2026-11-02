import { Router, Request, Response } from 'express';
import { controlStore } from '../control/store';

export const usageRouter = Router();

/**
 * GET /v1/usage - List recent invocation telemetry and metering events
 */
usageRouter.get('/usage', (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const events = controlStore.getUsageMetrics(limit);
  const summary = controlStore.getUsageSummary();

  res.status(200).json({
    summary,
    totalRecords: events.length,
    events,
  });
});

/**
 * GET /v1/usage/summary - Aggregated request latency, success rates, and cost telemetry
 */
usageRouter.get('/usage/summary', (_req: Request, res: Response) => {
  res.status(200).json(controlStore.getUsageSummary());
});
