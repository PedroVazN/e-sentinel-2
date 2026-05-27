import path from 'path';
import mongoose from 'mongoose';
import 'express-async-errors';
import express, { ErrorRequestHandler, Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db';

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
  if (!dbPromise) {
    dbPromise = connectDB(uri).then(() => undefined);
  }
  await dbPromise;
}

export function createApp(options: AppOptions = {}): Express {
  const { serveStatic = false } = options;
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL?.split(',') || true,
      credentials: true,
    })
  );
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

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'esentinel2-api',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      mongodbConfigured: !!process.env.MONGODB_URI,
      time: new Date().toISOString(),
    });
  });

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
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
