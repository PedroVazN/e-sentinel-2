import mongoose from 'mongoose';

let dbConnected = false;
let connectPromise: Promise<typeof mongoose> | null = null;

export function isDbConnected() {
  return dbConnected || mongoose.connection.readyState === 1;
}

export function resetMongoConnection() {
  dbConnected = false;
  connectPromise = null;
}

export async function ensureMongoConnection(uri: string) {
  const cleanUri = uri.trim();
  if (!cleanUri) {
    throw new Error('MONGODB_URI vazia');
  }

  if (mongoose.connection.readyState === 1) {
    dbConnected = true;
    return mongoose;
  }

  if (!connectPromise) {
    const onVercel = process.env.VERCEL === '1';

    connectPromise = mongoose
      .connect(cleanUri, {
        serverSelectionTimeoutMS: onVercel ? 20000 : 10000,
        connectTimeoutMS: onVercel ? 20000 : 10000,
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: onVercel ? 1 : 10,
        bufferCommands: false,
      })
      .then((connection) => {
        dbConnected = true;
        console.log('[MongoDB] Conectado com sucesso');
        return connection;
      })
      .catch((error) => {
        dbConnected = false;
        connectPromise = null;
        const msg = error?.message || String(error);
        console.error('[MongoDB] Erro ao conectar:', msg);
        throw new Error(msg);
      });
  }

  return connectPromise;
}

export function getDbState(): 'connected' | 'disconnected' | 'connecting' | 'disconnecting' {
  const states: Record<number, 'connected' | 'disconnected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] ?? 'disconnected';
}

mongoose.connection.on('connected', () => {
  dbConnected = true;
});

mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  connectPromise = null;
});
