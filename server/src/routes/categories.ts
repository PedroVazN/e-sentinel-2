import { Router } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';

const router = Router();

router.get('/', async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  const result = categories.map((c) => ({
    ...c.toObject(),
    productCount: map.get(String(c._id)) || 0,
  }));
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });
  res.json(category);
});

router.post('/', async (req, res) => {
  const { name, description, color, icon } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const category = await Category.create({ name: name.trim(), description, color, icon });
    res.status(201).json(category);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Já existe categoria com esse nome' });
    }
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });
  res.json(category);
});

router.delete('/:id', async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    return res.status(400).json({
      error: `Não é possível excluir: ${inUse} produto(s) usam esta categoria`,
    });
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
