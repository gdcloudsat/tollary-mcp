import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createApp } from './server/app';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

async function bootstrap() {
  const app = createApp();

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  } else {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Tollary Platform] Full-stack engine running on http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    console.log('[Tollary Platform] Gracefully terminating server...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Tollary Platform] Fatal startup error:', err);
  process.exit(1);
});
