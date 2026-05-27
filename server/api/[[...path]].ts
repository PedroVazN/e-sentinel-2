import type { IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';
const { loadEnv } = require('../dist/loadEnv') as { loadEnv: () => void };
const { createApp, ensureDb } = require('../dist/app') as {
  createApp: (options?: { serveStatic?: boolean }) => unknown;
  ensureDb: () => Promise<void>;
};

loadEnv();

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | null = null;
const DB_TIMEOUT_MS = process.env.VERCEL ? 22000 : 8000;

function normalizeApiPath(req: IncomingMessage) {
  const rawUrl = req.url || '/';
  const [pathname, query = ''] = rawUrl.split('?');

  if (pathname.startsWith('/api')) {
    return;
  }

  const apiPath = pathname === '/' ? '/api' : `/api${pathname}`;
  req.url = query ? `${apiPath}?${query}` : apiPath;
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  normalizeApiPath(req);

  if (!handler) {
    const app = createApp({ serveStatic: false }) as Parameters<typeof serverless>[0];
    handler = serverless(app, {
      binary: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream',
      ],
    });
  }

  if (!process.env.MONGODB_URI) {
    sendJson(res, 503, {
      error: 'MONGODB_URI não configurada na Vercel',
      hint: 'Settings → Environment Variables → MONGODB_URI',
    });
    return;
  }

  try {
    await Promise.race([
      ensureDb(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao conectar no MongoDB (22s)')), DB_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    const pathname = (req.url || '').split('?')[0] || '';
    if (pathname === '/api/health') {
      sendJson(res, 503, {
        status: 'degraded',
        service: 'esentinel2-api',
        db: 'disconnected',
        mongodbConfigured: true,
        dbError: error instanceof Error ? error.message : 'Falha ao conectar',
        time: new Date().toISOString(),
      });
      return;
    }

    sendJson(res, 503, {
      error: 'Banco indisponível no momento',
      detail: error instanceof Error ? error.message : 'Falha ao conectar no banco',
      hint: 'Confira MongoDB Atlas: Network Access 0.0.0.0/0 e URI com senha codificada',
    });
    return;
  }

  return handler(req, res);
}
