import cors from 'cors';

function parseOrigins(): string[] {
  return (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export function corsMiddleware() {
  const allowed = parseOrigins();

  return cors({
    origin(origin, callback) {
      // Postman, curl, same-origin
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = origin.replace(/\/$/, '');

      if (allowed.length === 0) {
        callback(null, true);
        return;
      }

      if (allowed.includes(normalized)) {
        callback(null, true);
        return;
      }

      // Permite subdomínios Vercel do frontend (ex: projeto-xxx.vercel.app)
      const allowVercelPreview = allowed.some((o) => o.includes('.vercel.app'));
      if (allowVercelPreview && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized)) {
        callback(null, true);
        return;
      }

      console.warn('[CORS] Origem bloqueada:', origin, '| Permitidas:', allowed.join(', '));
      callback(new Error(`CORS: origem não permitida (${origin})`));
    },
    credentials: true,
  });
}
