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
  /** Serve o frontend compilado (somente ambiente local / Node tradicional) */
  serveStatic?: boolean;
}

let dbPromise: Promise<void> | null = null;

export async function ensureDb(): Promise<void> {
  const uri = process.env.MONGODB_URI;
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
      message: 'Backend online. Use /api/health para status detalhado.',
      endpoints: {
        health: '/api/health',
        dashboard: '/api/dashboard',
        products: '/api/products',
        categories: '/api/categories',
      },
      time: new Date().toISOString(),
    });
  });

  app.get('/api/health', async (_req, res) => {
    let db = getDbState();
    let dbError: string | undefined;

    if (process.env.MONGODB_URI && db !== 'connected') {
      try {
        await ensureDb();
        db = getDbState();
      } catch (err) {
        dbError = err instanceof Error ? err.message : 'Falha ao conectar';
        db = getDbState();
      }
    }

    res.status(db === 'connected' ? 200 : 503).json({
      status: db === 'connected' ? 'ok' : 'degraded',
      service: 'esentinel2-api',
      db,
      mongodbConfigured: !!process.env.MONGODB_URI,
      dbError,
      time: new Date().toISOString(),
    });
  });

  app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path === '/health/') {
      return next();
    }

    if (mongoose.connection.readyState !== 1) {
      try {
        await ensureDb();
      } catch (err) {
        return res.status(503).json({
          error: 'Banco de dados indisponível',
          detail: err instanceof Error ? err.message : 'Falha na conexão MongoDB',
        });
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Banco de dados indisponível. Tente novamente.' });
    }

    next();
  });

  app.use('/api/categories', categoriesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/stock', stockRouter);
  app.use('/api/manufacturing', manufacturingRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportsRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Rota da API não encontrada' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error('[Erro API]', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';
    res.status(status).json({ error: message });
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
          console.error('[Erro] index.html não encontrado:', indexHtml);
          res.status(500).json({
            error: 'Frontend não compilado. Execute: npm run build --prefix client',
          });
        }
      });
    });
  }

  return app;
}
