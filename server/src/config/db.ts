import mongoose from 'mongoose';

export async function connectDB(uri: string) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Conexão perdida — tentando reconectar...');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconectado');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    family: 4,
    maxPoolSize: 10,
  });
  console.log('[MongoDB Atlas] Conectado com sucesso');
}
