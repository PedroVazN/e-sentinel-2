import dotenv from 'dotenv';
import path from 'path';
import dns from 'node:dns';
import { createApp, registerDbGate } from './app';
import { ensureMongoConnection } from './config/db';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI?.trim();
const isVercel = process.env.VERCEL === '1';

const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
  console.log(`[DNS] Servidores: ${dnsServers.join(', ')}`);
}

if (!mongoUri) {
  throw new Error('Defina MONGODB_URI no arquivo .env');
}

const serveClient = process.env.SERVE_CLIENT === 'true';
const app = createApp({ serveStatic: serveClient });

registerDbGate(app, () => ensureMongoConnection(mongoUri!));

async function connectMongoWithRetry() {
  try {
    await ensureMongoConnection(mongoUri!);
    console.log('[MongoDB] Conectado com sucesso.');
  } catch (error) {
    console.error('[MongoDB] Erro ao conectar:', error);
    setTimeout(connectMongoWithRetry, 10000);
  }
}

if (isVercel) {
  void ensureMongoConnection(mongoUri!).catch((err) => {
    console.error('[MongoDB] Cold start Vercel:', err instanceof Error ? err.message : err);
  });
} else {
  app.listen(port, () => {
    console.log(`\n🚀 API rodando em http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/api/health\n`);
  });
  void connectMongoWithRetry();
}

export default app;
