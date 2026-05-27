import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(uri: string) {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);

    cached.promise = mongoose
      .connect(uri, {
        maxPoolSize: process.env.VERCEL ? 1 : 10,
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      })
      .then((m) => {
        console.log('[MongoDB] Conectado');
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[MongoDB] Erro:', err?.message || err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export function resetDbCache() {
  cached.conn = null;
  cached.promise = null;
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
