import path from 'path';
import mongoose from 'mongoose';
import 'express-async-errors';
import express, { ErrorRequestHandler, Request, Response, NextFunction, Express } from 'express';
import morgan from 'morgan';
import { connectDB, getDbState } from './config/db';
import { corsMiddleware } from './config/cors';

import categoriesRouter from './routes/categories';
import productsRouter from './routes/products';
import stockRouter from './routes/stock';
import manufacturingRouter from './routes/manufacturing';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';

export interface AppOptions {
  serveStatic?: boolean;
}

let dbPromise: Promise<void> | null = null;

export async function ensureDb(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI não definida');
  }

  try {
    if (!dbPromise) {
      dbPromise = connectDB(uri).then(() => undefined);
    }
    await dbPromise;
  } catch (err) {
    dbPromise = null;
    throw err;
  }
}

async function requireDb(_req: Request, res: Response, next: NextFunction) {
  try {
    await ensureDb();
    next();
  } catch (err) {
    res.status(503).json({
      error: 'Banco de dados indisponível',
      detail: err instanceof Error ? err.message : 'Falha na conexão MongoDB',
    });
  }
}

export function createApp(options: AppOptions = {}): Express {
  const { serveStatic = false } = options;
  const app = express();

  app.use(corsMiddleware());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  if (!process.env.VERCEL) {
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  }

  app.get(['/', '/api'], (_req, res) => {
    res.json({
      status: 'ok',
      service: 'esentinel2-api',
      message: 'Backend online',
      health: '/api/health',
      time: new Date().toISOString(),
    });
  });

  app.get('/api/health', async (_req, res) => {
    let dbError: string | undefined;

    if (process.env.MONGODB_URI) {
      try {
        await ensureDb();
      } catch (err) {
        dbError = err instanceof Error ? err.message : 'Falha ao conectar';
      }
    }

    const db = getDbState();
    res.status(200).json({
      status: db === 'connected' ? 'ok' : 'degraded',
      service: 'esentinel2-api',
      db,
      mongodbConfigured: !!process.env.MONGODB_URI,
      dbError,
      time: new Date().toISOString(),
    });
  });

  app.use('/api/categories', requireDb, categoriesRouter);
  app.use('/api/products', requireDb, productsRouter);
  app.use('/api/stock', requireDb, stockRouter);
  app.use('/api/manufacturing', requireDb, manufacturingRouter);
  app.use('/api/dashboard', requireDb, dashboardRouter);
  app.use('/api/reports', requireDb, reportsRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Rota da API não encontrada' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error('[Erro API]', err);
    if (err.message?.includes('CORS')) {
      return res.status(403).json({ error: err.message });
    }
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
        if (err) {
          res.status(500).json({
            error: 'Frontend não compilado. Execute: npm run build --prefix client',
          });
        }
      });
    });
  }

  return app;
}
