import path from 'path';
import fs from 'fs';
import 'express-async-errors';
import express, { ErrorRequestHandler, Express } from 'express';
import morgan from 'morgan';
import { isDbConnected, ensureMongoConnection } from './config/db';
import { corsMiddleware } from './config/cors';

import categoriesRouter from './routes/categories';
import productsRouter from './routes/products';
import stockRouter from './routes/stock';
import manufacturingRouter from './routes/manufacturing';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';
import ordersRouter from './routes/orders';
import catalogRouter from './routes/catalog';

export interface AppOptions {
  serveStatic?: boolean;
}

let ensureMongoGate: (() => Promise<unknown>) | null = null;

export function createApp(options: AppOptions = {}): Express {
  const { serveStatic = false } = options;
  const app = express();

  app.use(corsMiddleware());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  if (!process.env.VERCEL) {
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    const apiPublicDir = path.join(__dirname, '..', 'public');
    if (fs.existsSync(apiPublicDir)) {
      app.use(express.static(apiPublicDir));
    }
  }

  app.get('/api', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'esentinel2-api',
      health: '/api/health',
      dashboard: '/api/dashboard',
      time: new Date().toISOString(),
    });
  });

  app.get('/api/health', async (_req, res) => {
    const uri = process.env.MONGODB_URI?.trim();
    let dbError: string | undefined;

    if (!uri) {
      return res.status(503).json({
        status: 'error',
        service: 'esentinel2-api',
        database: 'disconnected',
        error: 'MONGODB_URI não configurada na Vercel (Settings → Environment Variables)',
        time: new Date().toISOString(),
      });
    }

    if (!isDbConnected()) {
      try {
        await ensureMongoConnection(uri);
      } catch (err) {
        dbError = err instanceof Error ? err.message : 'Falha na conexão MongoDB';
      }
    }

    const connected = isDbConnected();
    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      service: 'esentinel2-api',
      database: connected ? 'connected' : 'disconnected',
      dbError,
      hint: connected
        ? undefined
        : 'Atlas: Network Access 0.0.0.0/0 | Vercel: DNS_SERVERS=8.8.8.8,1.1.1.1 | URI igual ao .env local',
      time: new Date().toISOString(),
    });
  });

  app.use('/api', async (req, res, next) => {
    if (req.path === '/health' || req.path === '/health/') {
      return next();
    }

    if (!ensureMongoGate) {
      return next();
    }

    if (!isDbConnected()) {
      try {
        await ensureMongoGate();
      } catch {
        // Erro tratado na resposta 503 abaixo.
      }
    }

    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Banco de dados indisponível. Verifique MONGODB_URI e Network Access 0.0.0.0/0 no Atlas.',
      });
    }

    next();
  });

  app.use('/api/categories', categoriesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/stock', stockRouter);
  app.use('/api/manufacturing', manufacturingRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/catalog', catalogRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Rota da API não encontrada' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error('[Erro API]', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Erro interno do servidor' });
  };
  app.use(errorHandler);

  if (serveStatic) {
    const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
    const indexHtml = path.join(CLIENT_DIST, 'index.html');
    app.use(express.static(CLIENT_DIST));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(indexHtml, (err) => {
        if (err) res.status(500).json({ error: 'Frontend não compilado' });
      });
    });
  }

  return app;
}

/** Middleware de banco — igual ERP-Dantas */
export function registerDbGate(_app: Express, ensureMongo: () => Promise<unknown>) {
  ensureMongoGate = ensureMongo;
}
