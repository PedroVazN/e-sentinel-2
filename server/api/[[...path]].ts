/**
 * Vercel: exporta o Express diretamente (padrão oficial).
 * https://vercel.com/guides/using-express-with-vercel
 */
import type { Express } from 'express';

export const config = {
  maxDuration: 60,
};

const { loadEnv } = require('../dist/loadEnv') as { loadEnv: () => void };
const { createApp } = require('../dist/app') as {
  createApp: (options?: { serveStatic?: boolean }) => Express;
};

loadEnv();

const app = createApp({ serveStatic: false });

export default app;
