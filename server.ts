import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import healthHandler from './api/health';
import configStatusHandler from './api/config-status';
import sitemapHandler from './api/sitemap';
import authHandler from './api/auth';
import storefrontHandler from './api/storefront';
import adminHandler from './api/admin';
import { ensureInitialAdminFromEnv } from './api/_lib/auth';

dotenv.config();

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' }));

// Mount unified API handlers (identical to Vercel serverless functions)
app.all('/api/health', (req, res) => void healthHandler(req, res));
app.all('/api/config-status', (req, res) => void configStatusHandler(req, res));
app.all('/api/sitemap', (req, res) => void sitemapHandler(req, res));
app.all('/sitemap.xml', (req, res) => void sitemapHandler(req, res));

app.all('/api/auth/*', (req, res) => {
  const subPath = req.path.replace(/^\/api\/auth\/?/, '');
  req.query = { ...req.query, __path: subPath };
  void authHandler(req, res);
});

app.all('/api/storefront/*', (req, res) => {
  const subPath = req.path.replace(/^\/api\/storefront\/?/, '');
  req.query = { ...req.query, __path: subPath };
  void storefrontHandler(req, res);
});

app.all('/api/admin/*', (req, res) => {
  const subPath = req.path.replace(/^\/api\/admin\/?/, '');
  req.query = { ...req.query, __path: subPath };
  void adminHandler(req, res);
});

async function startServer() {
  await ensureInitialAdminFromEnv();

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MCFD J GLOBAL VENTURES server listening on port ${PORT}`);
  });
}

startServer();
