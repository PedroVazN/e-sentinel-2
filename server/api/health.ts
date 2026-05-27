import type { IncomingMessage, ServerResponse } from 'http';

export const config = {
  maxDuration: 10,
};

/** Health instantâneo — não carrega Express nem MongoDB */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (_req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'esentinel2-api',
      message: 'API online (health leve)',
      mongodbConfigured: !!process.env.MONGODB_URI,
      time: new Date().toISOString(),
    })
  );
}
