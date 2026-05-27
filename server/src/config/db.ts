import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB(uri: string) {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (global.__mongooseConn) {
    try {
      return await global.__mongooseConn;
    } catch {
      global.__mongooseConn = undefined;
      await mongoose.disconnect().catch(() => undefined);
    }
  }

  mongoose.set('strictQuery', true);

  const opts = {
    serverSelectionTimeoutMS: 25000,
    connectTimeoutMS: 25000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    bufferCommands: false,
  };

  global.__mongooseConn = mongoose
    .connect(uri, opts)
    .then((m) => {
      console.log('[MongoDB] Conectado');
      return m;
    })
    .catch((err) => {
      global.__mongooseConn = undefined;
      console.error('[MongoDB] Erro:', err?.message || err);
      throw err;
    });

  return global.__mongooseConn;
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
