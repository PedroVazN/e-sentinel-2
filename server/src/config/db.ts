import mongoose from 'mongoose';

let dbConnected = false;
let connectPromise: Promise<typeof mongoose> | null = null;

export function isDbConnected() {
  return dbConnected || mongoose.connection.readyState === 1;
}

export async function ensureMongoConnection(uri: string) {
  if (mongoose.connection.readyState === 1) {
    dbConnected = true;
    return mongoose;
  }

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        family: 4,
        maxPoolSize: process.env.VERCEL ? 1 : 10,
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
        console.error('[MongoDB] Erro ao conectar:', error?.message || error);
        throw error;
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
});
