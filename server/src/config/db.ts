import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

function connectionOptions() {
  const isVercel = !!process.env.VERCEL;
  return {
    serverSelectionTimeoutMS: isVercel ? 20000 : 15000,
    connectTimeoutMS: isVercel ? 20000 : 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: isVercel ? 5 : 10,
    // IPv4 costuma ser mais estável em serverless
    family: 4 as const,
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
      mongoose.connection.close().catch(() => undefined);
    }
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Conexão perdida');
    global.__mongooseConn = undefined;
  });

  global.__mongooseConn = mongoose
    .connect(uri, connectionOptions())
    .then((m) => {
      console.log('[MongoDB] Conectado');
      return m;
    })
    .catch((err) => {
      global.__mongooseConn = undefined;
      console.error('[MongoDB] Falha na conexão:', err?.message || err);
      throw err;
    });

  return global.__mongooseConn;
}

export function getDbState(): 'connected' | 'disconnected' | 'connecting' | 'disconnecting' {
  const map: Record<number, 'connected' | 'disconnected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return map[mongoose.connection.readyState] || 'disconnected';
}
