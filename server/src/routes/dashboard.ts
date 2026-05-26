import { Router } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { StockMovement } from '../models/StockMovement';
import { Manufacturing } from '../models/Manufacturing';

const router = Router();

router.get('/', async (_req, res) => {
  const [
    totalProducts,
    totalCategories,
    stockAgg,
    lowStockCount,
    outOfStockCount,
    recentMovements,
    recentManufacturings,
    topProducts,
  ] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          totalCost: { $sum: { $multiply: ['$stock', '$cost'] } },
        },
      },
    ]),
    Product.countDocuments({ $expr: { $and: [{ $lte: ['$stock', '$minStock'] }, { $gt: ['$stock', 0] }] } }),
    Product.countDocuments({ stock: 0 }),
    StockMovement.find().populate('product', 'name images').sort('-createdAt').limit(8),
    Manufacturing.find().populate('product', 'name images').sort('-createdAt').limit(8),
    Product.find().sort('-stock').limit(5).populate('category', 'name color'),
  ]);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const movementsByDay = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: since30 } } },
    {
      $group: {
        _id: {
          d: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        total: { $sum: '$quantity' },
      },
    },
    { $sort: { '_id.d': 1 } },
  ]);

  const manufacturingByDay = await Manufacturing.aggregate([
    { $match: { productionDate: { $gte: since30 } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$productionDate' } },
        total: { $sum: '$quantity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const productsByCategory = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, stock: { $sum: '$stock' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: { $ifNull: ['$category.name', 'Sem categoria'] },
        color: { $ifNull: ['$category.color', '#94a3b8'] },
        count: 1,
        stock: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    totals: {
      products: totalProducts,
      categories: totalCategories,
      stockUnits: stockAgg[0]?.totalUnits || 0,
      stockValue: stockAgg[0]?.totalValue || 0,
      stockCost: stockAgg[0]?.totalCost || 0,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    },
    recentMovements,
    recentManufacturings,
    topProducts,
    movementsByDay,
    manufacturingByDay,
    productsByCategory,
  });
});

export default router;
