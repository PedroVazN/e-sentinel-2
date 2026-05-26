import serverless from 'serverless-http';
import { loadEnv } from '../server/dist/loadEnv';
import { createApp, ensureDb } from '../server/dist/app';

loadEnv();

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | null = null;

export default async function vercelHandler(req: unknown, res: unknown) {
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

  return handler(req as Parameters<ServerlessHandler>[0], res as Parameters<ServerlessHandler>[1]);
}
