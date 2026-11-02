import { Router, Request, Response } from 'express';
import { controlStore } from '../control/store';

export const pricingRulesRouter = Router();

/**
 * GET /v1/pricing/rules - List active rate cards and per-tool prices
 */
pricingRulesRouter.get('/rules', (_req: Request, res: Response) => {
  const rules = controlStore.getPricingRules();
  res.status(200).json({
    total: rules.length,
    rules,
  });
});

/**
 * POST /v1/pricing/rules - Create or update a dynamic tool pricing rule
 */
pricingRulesRouter.post('/rules', (req: Request, res: Response) => {
  const { serverId, toolName, unitPriceUsd, pricingModel } = req.body;

  if (!serverId || !toolName || unitPriceUsd === undefined) {
    res.status(400).json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'serverId, toolName, and unitPriceUsd are required.',
      },
    });
    return;
  }

  const rule = controlStore.setPricingRule({
    serverId,
    toolName,
    unitPriceUsd: Number(unitPriceUsd),
    pricingModel,
  });

  res.status(200).json({
    status: 'success',
    message: `Pricing rule for '${toolName}' updated to $${rule.unitPriceUsd} ${rule.currency}.`,
    rule,
  });
});
