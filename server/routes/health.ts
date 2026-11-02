import { Router, Request, Response } from 'express';
import { SystemHealthStatus } from '../types';

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const healthData: SystemHealthStatus = {
    status: 'healthy',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    version: '1.0.0-PROVISIONAL',
    nodeVersion: process.version,
    memory: {
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    },
    planes: {
      dataPlane: {
        status: 'operational',
        protocols: ['MCP/2024-11-05 (Streamable HTTP)', 'x402 RFC Payment Required', 'REST Gateway v1'],
        activeConnections: 1,
      },
      controlPlane: {
        status: 'operational',
        activeServices: 12,
      },
    },
  };

  res.status(200).json(healthData);
});

healthRouter.get('/info', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Tollary Infrastructure Platform',
    tagline: 'Discover. Connect. Execute. Monetize.',
    version: '1.0.0-PROVISIONAL',
    protocols: {
      mcp: {
        supportedVersions: ['2024-11-05'],
        transports: ['streamable_http', 'http_sse'],
      },
      x402: {
        specification: 'https://www.x402.org/',
        defaultAsset: 'USDC',
        defaultNetwork: 'Base',
        facilitator: 'Coinbase Facilitator',
      },
    },
    endpoints: {
      mcpGateway: '/mcp/:serverId',
      restGateway: '/g/:provider/:service/*',
      discovery: '/v1/discover',
      providers: '/v1/providers',
      pricingRules: '/v1/pricing/rules',
      health: '/v1/health',
    },
  });
});
