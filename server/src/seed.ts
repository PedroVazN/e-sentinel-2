import 'dotenv/config';
import { connectDB } from './config/db';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { StockMovement } from './models/StockMovement';

async function seed() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esentinel2');

  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), StockMovement.deleteMany({})]);

  const categories = await Category.insertMany([
    { name: 'Sabonetes', description: 'Sabonetes artesanais', color: '#8b5cf6', icon: 'sparkles' },
    { name: 'Velas', description: 'Velas aromáticas', color: '#f59e0b', icon: 'flame' },
    { name: 'Difusores', description: 'Difusores de ambiente', color: '#10b981', icon: 'wind' },
    { name: 'Cremes', description: 'Cremes corporais', color: '#ec4899', icon: 'heart' },
  ]);

  const sample = [
    { name: 'Sabonete Lavanda', fragrance: 'Lavanda', format: 'Barra', netWeight: '90g', color: 'Roxo', price: 14.9, cost: 6, stock: 80, minStock: 10 },
    { name: 'Sabonete Rosa Mosqueta', fragrance: 'Rosas', format: 'Barra', netWeight: '90g', color: 'Rosa', price: 16.9, cost: 7, stock: 50, minStock: 10 },
    { name: 'Vela Aromática Baunilha', fragrance: 'Baunilha', format: 'Pote 200g', netWeight: '200g', color: 'Bege', price: 49.9, cost: 22, stock: 35, minStock: 5 },
    { name: 'Vela Lavanda Relaxante', fragrance: 'Lavanda', format: 'Pote 200g', netWeight: '200g', color: 'Roxo', price: 52.9, cost: 24, stock: 20, minStock: 5 },
    { name: 'Difusor de Bambu', fragrance: 'Bambu', format: 'Frasco 250ml', netWeight: '250ml', color: 'Verde', price: 79.9, cost: 35, stock: 18, minStock: 4 },
    { name: 'Creme Hidratante Karité', fragrance: 'Karité', format: 'Pote 250g', netWeight: '250g', color: 'Branco', price: 39.9, cost: 17, stock: 60, minStock: 8 },
  ];

  const cats = ['Sabonetes', 'Sabonetes', 'Velas', 'Velas', 'Difusores', 'Cremes'];
  for (let i = 0; i < sample.length; i++) {
    const cat = categories.find((c) => c.name === cats[i]);
    const p = await Product.create({
      ...sample[i],
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      description: `${sample[i].name} feito artesanalmente com ingredientes naturais.`,
      category: cat?._id,
      images: [],
    });
    if (sample[i].stock > 0) {
      await StockMovement.create({
        product: p._id,
        type: 'entrada',
        quantity: sample[i].stock,
        reason: 'Estoque inicial (seed)',
        previousStock: 0,
        newStock: sample[i].stock,
      });
    }
  }

  console.log('✅ Seed concluído! Categorias e produtos de exemplo criados.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
