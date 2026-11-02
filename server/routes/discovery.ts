import { Router, Request, Response } from 'express';
import { discoveryEngine } from '../discovery/engine';

export const discoveryRouter = Router();

/**
 * GET /v1/discover - Hybrid Search & Capability Discovery API
 */
discoveryRouter.get('/discover', (req: Request, res: Response) => {
  const { q, protocol, max_price, verified_only, category, limit, offset } = req.query;

  const results = discoveryEngine.search({
    query: typeof q === 'string' ? q : undefined,
    protocol: (protocol as any) || 'all',
    maxPriceUsd: max_price ? Number(max_price) : undefined,
    verifiedOnly: verified_only === 'true' || verified_only === '1',
    category: typeof category === 'string' ? category : undefined,
    limit: limit ? Number(limit) : 20,
    offset: offset ? Number(offset) : 0,
  });

  res.status(200).json(results);
});

/**
 * GET /v1/tools/:id - Direct Tool Schema & Pricing Details
 */
discoveryRouter.get('/tools/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tool = discoveryEngine.getToolById(id);

  if (!tool) {
    res.status(404).json({
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Tool with id or name '${id}' was not found in the discovery registry.`,
      },
    });
    return;
  }

  res.status(200).json(tool);
});

/**
 * GET /v1/categories - Tool Categories with Aggregate Counts
 */
discoveryRouter.get('/categories', (_req: Request, res: Response) => {
  const allTools = discoveryEngine.search({ limit: 100 }).results;
  const counts: Record<string, number> = {};

  for (const t of allTools) {
    counts[t.category] = (counts[t.category] || 0) + 1;
  }

  const categoryList = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
  }));

  res.status(200).json({
    totalCategories: categoryList.length,
    categories: categoryList,
  });
});
