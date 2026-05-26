import { Router } from 'express';
import { Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { StockMovement } from '../models/StockMovement';
import { upload, uploadImage, deleteImage } from '../config/cloudinary';
import { escapeRegex } from '../utils/escapeRegex';

const router = Router();

const ALLOWED_SORT = new Set([
  'createdAt', '-createdAt', 'name', '-name', 'price', '-price', 'stock', '-stock',
]);

function normalizeCategory(value: unknown) {
  if (!value || value === '') return null;
  if (typeof value === 'string' && Types.ObjectId.isValid(value)) return value;
  return null;
}

router.get('/export/template', (_req, res) => {
  const headers = [
    'Nome do Produto',
    'SKU',
    'Descrição',
    'Fragrância',
    'Formato',
    'Peso Líquido',
    'Coloração',
    'Categoria',
    'Preço',
    'Custo',
    'Quantidade em Estoque',
    'Estoque Mínimo',
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    [
      'Sabonete Lavanda 90g',
      'SBN-001',
      'Sabonete artesanal',
      'Lavanda',
      'Barra',
      '90g',
      'Roxo',
      'Sabonetes',
      9.9,
      4.5,
      100,
      10,
    ],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="modelo-produtos.xlsx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buf);
});

router.get('/', async (req, res) => {
  const {
    search = '',
    category,
    minPrice,
    maxPrice,
    inStock,
    lowStock,
    sort = '-createdAt',
    page = '1',
    limit = '50',
  } = req.query as Record<string, string>;

  const filter: any = {};
  if (search) {
    const re = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [
      { name: re },
      { description: re },
      { fragrance: re },
      { sku: re },
      { color: re },
      { format: re },
    ];
  }
  if (category && Types.ObjectId.isValid(category)) filter.category = category;
  if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  if (inStock === 'true') filter.stock = { ...(filter.stock || {}), $gt: 0 };
  if (lowStock === 'true') {
    filter.$expr = { $lte: ['$stock', '$minStock'] };
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const lim = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
  const sortField = ALLOWED_SORT.has(String(sort)) ? String(sort) : '-createdAt';
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category')
    .sort(sortField)
    .skip((pageNum - 1) * lim)
    .limit(lim);

  res.json({ data: products, total, page: pageNum, limit: lim });
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

router.post('/', async (req, res) => {
  const body = { ...req.body };
  body.category = normalizeCategory(body.category);
  if (!body.name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const initialStock = Number(body.stock) || 0;
  body.stock = 0;
  const product = await Product.create(body);

  if (initialStock > 0) {
    product.stock = initialStock;
    await product.save();
    await StockMovement.create({
      product: product._id,
      type: 'entrada',
      quantity: initialStock,
      reason: 'Estoque inicial no cadastro',
      previousStock: 0,
      newStock: initialStock,
    });
  }

  const populated = await product.populate('category');
  res.status(201).json(populated);
});

router.put('/:id', async (req, res) => {
  const body = { ...req.body };
  if ('category' in body) body.category = normalizeCategory(body.category);
  delete body.stock;
  const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true }).populate(
    'category'
  );
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

router.delete('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  for (const img of product.images || []) {
    if (img.publicId) await deleteImage(img.publicId);
  }
  await StockMovement.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ ok: true });
});

router.post('/upload', upload.array('images', 12), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const images = await Promise.all(files.map((f) => uploadImage(f)));
  res.json({ images });
});

router.post('/:id/images', upload.array('images', 12), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  const files = (req.files as Express.Multer.File[]) || [];
  const newImages = await Promise.all(files.map((f) => uploadImage(f)));
  product.images.push(...newImages);
  await product.save();
  res.json(product);
});

router.delete('/:id/images/:publicId', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  const publicId = decodeURIComponent(req.params.publicId);
  const target = product.images.find((i) => i.publicId === publicId);
  if (!target) return res.status(404).json({ error: 'Imagem não encontrada' });
  await deleteImage(target.publicId);
  product.images.pull({ publicId });
  await product.save();
  res.json(product);
});

router.post('/import', upload.single('file'), async (req, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'Arquivo não enviado' });
  const wb = XLSX.read(file.buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

  const categoriesMap = new Map<string, any>();
  const cats = await Category.find();
  cats.forEach((c) => categoriesMap.set(c.name.toLowerCase().trim(), c));

  const norm = (obj: any, keys: string[]) => {
    for (const k of keys) {
      const v = Object.keys(obj).find((kk) => kk.toLowerCase().trim() === k.toLowerCase());
      if (v && obj[v] !== '' && obj[v] !== undefined && obj[v] !== null) return obj[v];
    }
    return '';
  };

  const created: any[] = [];
  const errors: any[] = [];

  for (const [idx, row] of rows.entries()) {
    try {
      const name = String(norm(row, ['nome', 'nome do produto', 'name', 'produto'])).trim();
      if (!name) {
        errors.push({ linha: idx + 2, erro: 'Nome em branco' });
        continue;
      }
      const catName = String(norm(row, ['categoria', 'category'])).trim().toLowerCase();
      let category: any = catName ? categoriesMap.get(catName) : null;
      if (catName && !category) {
        category = await Category.create({ name: catName });
        categoriesMap.set(catName, category);
      }
      const stock = Number(norm(row, ['quantidade em estoque', 'estoque', 'quantidade', 'stock'])) || 0;

      const data: any = {
        name,
        sku: String(norm(row, ['sku', 'código', 'codigo'])).trim(),
        description: String(norm(row, ['descrição', 'descricao', 'description'])),
        fragrance: String(norm(row, ['fragrância', 'fragrancia', 'fragrance'])),
        format: String(norm(row, ['formato', 'format'])),
        netWeight: String(norm(row, ['peso líquido', 'peso liquido', 'peso', 'weight'])),
        color: String(norm(row, ['coloração', 'coloracao', 'cor', 'color'])),
        category: category?._id || null,
        price: Number(norm(row, ['preço', 'preco', 'price'])) || 0,
        cost: Number(norm(row, ['custo', 'cost'])) || 0,
        minStock: Number(norm(row, ['estoque mínimo', 'estoque minimo', 'min stock'])) || 0,
        stock: 0,
      };

      const product = await Product.create(data);
      if (stock > 0) {
        product.stock = stock;
        await product.save();
        await StockMovement.create({
          product: product._id,
          type: 'entrada',
          quantity: stock,
          reason: 'Importação Excel',
          previousStock: 0,
          newStock: stock,
        });
      }
      created.push(product);
    } catch (err: any) {
      errors.push({ linha: idx + 2, erro: err.message });
    }
  }

  res.json({ totalLinhas: rows.length, criados: created.length, erros: errors });
});

export default router;
