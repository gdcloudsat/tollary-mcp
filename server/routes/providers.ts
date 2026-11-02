import { Router, Request, Response } from 'express';
import { controlStore } from '../control/store';

export const providersRouter = Router();

/**
 * GET /v1/providers - List all registered providers
 */
providersRouter.get('/providers', (_req: Request, res: Response) => {
  const providers = controlStore.getProviders();
  res.status(200).json({
    total: providers.length,
    providers,
  });
});

/**
 * GET /v1/providers/:id - Get single provider details
 */
providersRouter.get('/providers/:id', (req: Request, res: Response) => {
  const provider = controlStore.getProviderById(req.params.id);
  if (!provider) {
    res.status(404).json({ error: { code: 'PROVIDER_NOT_FOUND', message: 'Provider not found.' } });
    return;
  }
  res.status(200).json(provider);
});

/**
 * POST /v1/providers - Onboard a new service provider
 */
providersRouter.post('/providers', (req: Request, res: Response) => {
  const { name, legalEntityName, contactEmail, payoutAddress } = req.body;

  if (!name || !contactEmail || !payoutAddress) {
    res.status(400).json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'name, contactEmail, and payoutAddress are required.',
      },
    });
    return;
  }

  const provider = controlStore.createProvider({
    name,
    legalEntityName: legalEntityName || name,
    contactEmail,
    payoutAddress,
  });

  res.status(201).json({
    status: 'success',
    message: `Provider '${name}' successfully onboarded.`,
    provider,
  });
});
