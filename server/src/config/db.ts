import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

function getOptions() {
  const onVercel = !!process.env.VERCEL;
  return {
    maxPoolSize: onVercel ? 1 : 10,
    serverSelectionTimeoutMS: onVercel ? 5000 : 20000,
    connectTimeoutMS: onVercel ? 5000 : 20000,
    socketTimeoutMS: 20000,
    bufferCommands: false,
  };
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

  global.__mongooseConn = mongoose
    .connect(uri, getOptions())
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

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} (${ms}ms)`)), ms)
    ),
  ]);
}
