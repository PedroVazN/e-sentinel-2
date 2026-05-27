import type { IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';

const { loadEnv } = require('../dist/loadEnv') as { loadEnv: () => void };
const { createApp, warmDbConnection } = require('../dist/app') as {
  createApp: (options?: { serveStatic?: boolean }) => unknown;
  warmDbConnection: () => void;
};

loadEnv();

// Aumenta limite da função (Pro: até 60s; Hobby: máx 10s)
export const config = {
  maxDuration: 60,
};

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | null = null;

// Começa a conectar no MongoDB assim que a função sobe (cold start)
warmDbConnection();

function normalizeApiPath(req: IncomingMessage) {
  const rawUrl = req.url || '/';
  const [pathname, query = ''] = rawUrl.split('?');

  if (pathname.startsWith('/api')) return;

  const apiPath = pathname === '/' ? '/api' : `/api${pathname}`;
  req.url = query ? `${apiPath}?${query}` : apiPath;
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

  return handler(req, res);
}
