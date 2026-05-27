import { Router } from 'express';
import { Types } from 'mongoose';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { escapeRegex } from '../utils/escapeRegex';

const router = Router();

const ALLOWED_SORT = new Set(['createdAt', '-createdAt', 'name', '-name', 'price', '-price']);

router.get('/categories', async (_req, res) => {
  const categories = await Category.find().sort('name').lean();
  const productCount = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(productCount.map((item) => [String(item._id || ''), item.count]));
  res.json(
    categories.map((category: any) => ({
      ...category,
      productCount: countMap.get(String(category._id)) || 0,
    }))
  );
});

router.get('/products', async (req, res) => {
  const { search = '', category, minPrice, maxPrice, sort = 'name', page = '1', limit = '50' } = req.query as Record<
    string,
    string
  >;

  const filter: any = { active: true };
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { description: re }, { fragrance: re }, { sku: re }, { format: re }];
  }
  if (category && Types.ObjectId.isValid(category)) filter.category = category;
  if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const sortField = ALLOWED_SORT.has(sort) ? sort : 'name';

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category')
    .sort(sortField)
    .skip((pageNum - 1) * lim)
    .limit(lim)
    .lean();

  const data = products.map((product: any) => ({
    ...product,
    cost: undefined,
    minStock: undefined,
  }));

  res.json({ data, total, page: pageNum, limit: lim });
});

export default router;
