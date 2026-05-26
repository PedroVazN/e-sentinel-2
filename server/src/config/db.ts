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
    return global.__mongooseConn;
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Conexão perdida — tentando reconectar...');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconectado');
  });

  global.__mongooseConn = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      family: 4,
      maxPoolSize: process.env.VERCEL ? 5 : 10,
    })
    .then(() => {
      console.log('[MongoDB Atlas] Conectado com sucesso');
      return mongoose;
    });

  return global.__mongooseConn;
}
