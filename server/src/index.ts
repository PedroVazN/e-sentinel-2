import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', 'server', '.env') });
dotenv.config();

import 'express-async-errors';
import express, { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db';

import categoriesRouter from './routes/categories';
import productsRouter from './routes/products';
import stockRouter from './routes/stock';
import manufacturingRouter from './routes/manufacturing';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('[Erro] MONGODB_URI não definida no .env');
  process.exit(1);
}

app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'esentinel2-api',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

// Garante que o MongoDB está conectado antes das rotas da API
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Banco de dados indisponível. Reinicie o servidor.' });
  }
  next();
});

app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/manufacturing', manufacturingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// 404 para rotas API inexistentes (JSON, não HTML)
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

// Frontend em produção (apenas rotas que NÃO são API)
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
const indexHtml = path.join(CLIENT_DIST, 'index.html');

app.use(express.static(CLIENT_DIST));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(indexHtml, (err) => {
    if (err) {
      console.error('[Erro] index.html não encontrado:', indexHtml);
      res.status(500).json({ error: 'Frontend não compilado. Execute: npm run build --prefix client' });
    }
  });
});

async function bootstrap() {
  try {
    await connectDB(MONGODB_URI!);
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Sistema rodando em http://localhost:${PORT}`);
      console.log(`   API Health: http://localhost:${PORT}/api/health\n`);
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Erro] Porta ${PORT} já está em uso.`);
        console.error('Encerre o processo anterior ou altere PORT no .env\n');
        process.exit(1);
      }
      console.error('[Erro no servidor HTTP]', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[Falha na inicialização]', err);
    process.exit(1);
  }
}

bootstrap();
