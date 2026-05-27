import cors from 'cors';

function parseOrigins(): string[] {
  return (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  const normalized = origin.replace(/\/$/, '');

  if (allowed.includes(normalized)) return true;

  try {
    const host = new URL(normalized).hostname;
    if (host === 'localhost' || host.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }

  return false;
}

export function corsMiddleware() {
  const allowed = parseOrigins();

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowed.length === 0 || isAllowedOrigin(origin, allowed)) {
        callback(null, true);
        return;
      }

      console.warn('[CORS] origem não listada, permitindo:', origin);
      callback(null, true);
    },
    credentials: true,
  });
}
