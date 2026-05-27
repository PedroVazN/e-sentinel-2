import cors from 'cors';

/** CORS aberto — aceita qualquer origem (frontend em qualquer domínio). */
export function corsMiddleware() {
  return cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });
}
