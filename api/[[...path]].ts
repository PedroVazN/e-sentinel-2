import type { IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';
import { loadEnv } from '../server/dist/loadEnv';
import { createApp, ensureDb } from '../server/dist/app';

loadEnv();

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | null = null;

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
  await ensureDb();

  if (!handler) {
    const app = createApp({ serveStatic: false });
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
