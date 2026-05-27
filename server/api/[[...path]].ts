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
const DB_TIMEOUT_MS = 8000;

function normalizeApiPath(req: IncomingMessage) {
  const rawUrl = req.url || '/';
  const [pathname, query = ''] = rawUrl.split('?');

  if (pathname.startsWith('/api')) {
    return;
  }

  const apiPath = pathname === '/' ? '/api' : `/api${pathname}`;
  req.url = query ? `${apiPath}?${query}` : apiPath;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  normalizeApiPath(req);
  const pathname = (req.url || '').split('?')[0] || '';
  const isHealth = pathname === '/api/health';

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

  if (!isHealth) {
    try {
      await Promise.race([
        ensureDb(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de conexão com banco')), DB_TIMEOUT_MS)
        ),
      ]);
    } catch (error) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Banco indisponível no momento',
          detail: error instanceof Error ? error.message : 'Falha ao conectar no banco',
        })
      );
      return;
    }
  }

  return handler(req, res);
}
