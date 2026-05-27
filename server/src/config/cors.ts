import cors from 'cors';

const explicitAllowedOrigins = [
  ...(process.env.CLIENT_URLS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  process.env.CLIENT_URL?.trim() || '',
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ''));

const allowVercelPreviews =
  (process.env.ALLOW_VERCEL_PREVIEWS || 'true').toLowerCase() === 'true';

/** Mesmo padrão do ERP-Dantas */
export function corsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (explicitAllowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      if (allowVercelPreviews) {
        try {
          const hostname = new URL(normalizedOrigin).hostname;
          if (hostname.endsWith('.vercel.app')) {
            return callback(null, true);
          }
        } catch {
          // origem inválida
        }
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
  });
}
