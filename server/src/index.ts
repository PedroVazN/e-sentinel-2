import { loadEnv } from './loadEnv';

loadEnv();

import { createApp, ensureDb } from './app';

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[Erro] MONGODB_URI não definida no .env');
  process.exit(1);
}

const serveClient = process.env.SERVE_CLIENT === 'true';
const app = createApp({ serveStatic: serveClient });

async function bootstrap() {
  try {
    await ensureDb();
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 API rodando em http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      if (serveClient) console.log(`   Frontend: http://localhost:${PORT}\n`);
      else console.log(`   (Somente API — frontend separado em client/)\n`);
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Erro] Porta ${PORT} já está em uso.`);
        console.error('Encerre o processo anterior ou altere PORT no .env\n');
        process.exit(1);
      }
      console.error('[Erro no servidor HTTP]', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[Falha na inicialização]', err);
    process.exit(1);
  }
}

bootstrap();
