import { Router } from 'express';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';

const router = Router();

router.get('/movements', async (req, res) => {
  const { product, type, page = '1', limit = '50', from, to } = req.query as Record<string, string>;
  const filter: any = {};
  if (product) filter.product = product;
  if (type) filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const pageNum = Math.max(1, parseInt(page));
  const lim = Math.min(200, Math.max(1, parseInt(limit)));
  const total = await StockMovement.countDocuments(filter);
  const movements = await StockMovement.find(filter)
    .populate('product', 'name sku images')
    .sort('-createdAt')
    .skip((pageNum - 1) * lim)
    .limit(lim);
  res.json({ data: movements, total, page: pageNum, limit: lim });
});

router.post('/entrada', async (req, res) => {
  const { product: productId, quantity, reason = '', reference = '' } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Produto e quantidade válida são obrigatórios' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  const previous = product.stock;
  product.stock = previous + Number(quantity);
  await product.save();
  const movement = await StockMovement.create({
    product: product._id,
    type: 'entrada',
    quantity: Number(quantity),
    reason,
    reference,
    previousStock: previous,
    newStock: product.stock,
  });
  res.status(201).json(movement);
});

router.post('/saida', async (req, res) => {
  const { product: productId, quantity, reason = '', reference = '' } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Produto e quantidade válida são obrigatórios' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  if (product.stock < Number(quantity)) {
    return res.status(400).json({ error: 'Estoque insuficiente' });
  }
  const previous = product.stock;
  product.stock = previous - Number(quantity);
  await product.save();
  const movement = await StockMovement.create({
    product: product._id,
    type: 'saida',
    quantity: Number(quantity),
    reason,
    reference,
    previousStock: previous,
    newStock: product.stock,
  });
  res.status(201).json(movement);
});

router.post('/ajuste', async (req, res) => {
  const { product: productId, newStock, reason = 'Ajuste manual' } = req.body;
  if (!productId || newStock === undefined || newStock < 0) {
    return res.status(400).json({ error: 'Produto e novo estoque válido são obrigatórios' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  const previous = product.stock;
  const diff = Number(newStock) - previous;
  product.stock = Number(newStock);
  await product.save();
  const movement = await StockMovement.create({
    product: product._id,
    type: 'ajuste',
    quantity: Math.abs(diff),
    reason,
    previousStock: previous,
    newStock: product.stock,
  });
  res.status(201).json(movement);
});

export default router;
