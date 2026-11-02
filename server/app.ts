import express, { Express, Request, Response, NextFunction } from 'express';
import { healthRouter } from './routes/health';
import { mcpGatewayRouter } from './routes/mcpGateway';
import { transactionsRouter } from './routes/transactions';
import { discoveryRouter } from './routes/discovery';
import { providersRouter } from './routes/providers';
import { mcpServersRouter } from './routes/mcpServers';
import { pricingRulesRouter } from './routes/pricingRules';
import { usageRouter } from './routes/usage';
import { gatewayProxyRouter } from './routes/gatewayProxy';
import { RequestWithRawBody } from './types';

export function createApp(): Express {
  const app = express();

  // Middleware: Capture raw request body buffer for x402 / HMAC cryptographic signatures
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: RequestWithRawBody, _res: Response, buf: Buffer) => {
        req.rawBody = buf;
      },
    })
  );

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request correlation & basic timing middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const traceId = `trc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    res.setHeader('X-Tollary-Trace-ID', traceId);
    res.setHeader('X-Tollary-Gateway', 'tollary-express-gateway/1.0.0');
    next();
  });

  // Mount API Subsystems
  app.use('/v1', healthRouter);
  app.use('/v1', transactionsRouter);
  app.use('/v1', discoveryRouter);
  app.use('/v1', providersRouter);
  app.use('/v1/mcp', mcpServersRouter);
  app.use('/v1/pricing', pricingRulesRouter);
  app.use('/v1', usageRouter);
  app.use('/mcp', mcpGatewayRouter);
  app.use('/g', gatewayProxyRouter);

  return app;
}
