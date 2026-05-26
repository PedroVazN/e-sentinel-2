import { Router } from 'express';
import { Manufacturing } from '../models/Manufacturing';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';

const router = Router();

router.get('/', async (req, res) => {
  const { product, page = '1', limit = '50', from, to } = req.query as Record<string, string>;
  const filter: any = {};
  if (product) filter.product = product;
  if (from || to) {
    filter.productionDate = {};
    if (from) filter.productionDate.$gte = new Date(from);
    if (to) filter.productionDate.$lte = new Date(to);
  }
  const pageNum = Math.max(1, parseInt(page));
  const lim = Math.min(200, Math.max(1, parseInt(limit)));
  const total = await Manufacturing.countDocuments(filter);
  const records = await Manufacturing.find(filter)
    .populate('product', 'name sku images')
    .sort('-productionDate')
    .skip((pageNum - 1) * lim)
    .limit(lim);
  res.json({ data: records, total, page: pageNum, limit: lim });
});

router.post('/', async (req, res) => {
  const { product: productId, quantity, batchCode, productionDate, expirationDate, notes, cost, operator } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Produto e quantidade válida são obrigatórios' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const previous = product.stock;
  product.stock = previous + Number(quantity);
  await product.save();

  const record = await Manufacturing.create({
    product: product._id,
    quantity: Number(quantity),
    batchCode,
    productionDate: productionDate ? new Date(productionDate) : new Date(),
    expirationDate: expirationDate ? new Date(expirationDate) : null,
    notes,
    cost: Number(cost) || 0,
    operator,
  });

  await StockMovement.create({
    product: product._id,
    type: 'fabricacao',
    quantity: Number(quantity),
    reason: `Fabricação${batchCode ? ' - Lote ' + batchCode : ''}`,
    reference: String(record._id),
    previousStock: previous,
    newStock: product.stock,
  });

  const populated = await record.populate('product', 'name sku images');
  res.status(201).json(populated);
});

router.delete('/:id', async (req, res) => {
  const record = await Manufacturing.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Registro não encontrado' });
  const product = await Product.findById(record.product);
  if (product) {
    const previous = product.stock;
    const newStock = Math.max(0, previous - record.quantity);
    product.stock = newStock;
    await product.save();
    await StockMovement.create({
      product: product._id,
      type: 'ajuste',
      quantity: previous - newStock,
      reason: `Estorno de fabricação ${record.batchCode || ''}`.trim(),
      previousStock: previous,
      newStock,
    });
  }
  await record.deleteOne();
  res.json({ ok: true });
});

export default router;
