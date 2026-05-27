import type { IncomingMessage, ServerResponse } from 'http';

export const config = {
  maxDuration: 60,
};

type ServerlessHandler = (req: IncomingMessage, res: ServerResponse) => unknown;

let handler: ServerlessHandler | null = null;

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function normalizeApiPath(req: IncomingMessage) {
  const rawUrl = req.url || '/';
  const [pathname, query = ''] = rawUrl.split('?');

  if (pathname.startsWith('/api')) return;

  const apiPath = pathname === '/' ? '/api' : `/api${pathname}`;
  req.url = query ? `${apiPath}?${query}` : apiPath;
}

async function getHandler(): Promise<ServerlessHandler> {
  if (handler) return handler;

  const serverless = require('serverless-http') as typeof import('serverless-http');
  const { loadEnv } = require('../dist/loadEnv') as { loadEnv: () => void };
  const { createApp } = require('../dist/app') as {
    createApp: (options?: { serveStatic?: boolean }) => unknown;
  };

  loadEnv();

  const app = createApp({ serveStatic: false });
  handler = serverless(app, {
    binary: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ],
  }) as ServerlessHandler;

  return handler;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const pathname = (req.url || '').split('?')[0] || '';

  // health.ts dedicado deve responder; fallback se cair aqui
  if (pathname === '/api/health' || pathname === '/api/health/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'esentinel2-api',
        time: new Date().toISOString(),
      })
    );
    return;
  }

  normalizeApiPath(req);

  try {
    const h = await getHandler();
    return h(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Falha ao iniciar API',
        detail: err instanceof Error ? err.message : String(err),
      })
    );
  }
}
