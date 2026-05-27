import { Router } from 'express';
import { Product } from '../models/Product';
import { Order, OrderStatus } from '../models/Order';
import { StockMovement } from '../models/StockMovement';

const router = Router();

function buildOrderNumber() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `PED-${year}${month}${day}-${random}`;
}

router.get('/', async (req, res) => {
  const { status, search = '', page = '1', limit = '50' } = req.query as Record<string, string>;
  const filter: any = {};

  if (status && ['pending', 'confirmed', 'cancelled', 'fulfilled'].includes(status)) {
    filter.status = status;
  }
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [
      { orderNumber: re },
      { 'customer.name': re },
      { 'customer.company': re },
      { 'customer.phone': re },
      { 'customer.email': re },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const total = await Order.countDocuments(filter);
  const data = await Order.find(filter).sort('-createdAt').skip((pageNum - 1) * lim).limit(lim);
  res.json({ data, total, page: pageNum, limit: lim });
});

router.post('/', async (req, res) => {
  const { customer, items } = req.body as {
    customer?: { name?: string; company?: string; phone?: string; email?: string; notes?: string };
    items?: Array<{ productId?: string; quantity?: number }>;
  };

  if (!customer?.name || !customer?.phone || !customer?.email) {
    return res.status(400).json({ error: 'Nome, telefone e e-mail são obrigatórios' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Adicione ao menos um item ao pedido' });
  }

  const normalizedItems = items
    .map((item) => ({
      productId: item.productId || '',
      quantity: Number(item.quantity) || 0,
    }))
    .filter((item) => item.productId && item.quantity > 0);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: 'Itens inválidos no pedido' });
  }

  const productIds = normalizedItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, active: true });
  const productsMap = new Map(products.map((product) => [String(product._id), product]));

  const orderItems = normalizedItems.map((item) => {
    const product = productsMap.get(item.productId);
    if (!product) {
      throw new Error(`Produto inválido no pedido: ${item.productId}`);
    }
    const subtotal = product.price * item.quantity;
    return {
      product: product._id,
      name: product.name,
      sku: product.sku || '',
      unitPrice: product.price,
      quantity: item.quantity,
      subtotal,
    };
  });

  const subtotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
  const total = subtotal;
  const orderNumber = buildOrderNumber();

  const order = await Order.create({
    orderNumber,
    status: 'pending',
    customer: {
      name: customer.name.trim(),
      company: (customer.company || '').trim(),
      phone: customer.phone.trim(),
      email: customer.email.trim(),
      notes: (customer.notes || '').trim(),
    },
    items: orderItems,
    subtotal,
    total,
  });

  res.status(201).json(order);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body as { status?: OrderStatus };
  if (!status || !['pending', 'confirmed', 'cancelled', 'fulfilled'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  order.status = status;
  await order.save();
  res.json(order);
});

router.post('/:id/fulfill', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (order.status === 'fulfilled') return res.status(400).json({ error: 'Pedido já faturado' });
  if (order.status === 'cancelled') return res.status(400).json({ error: 'Pedido cancelado' });

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ error: `Produto removido: ${item.name}` });
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Estoque insuficiente para ${product.name}` });
    }
  }

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const previous = product.stock;
    product.stock = previous - item.quantity;
    await product.save();
    await StockMovement.create({
      product: product._id,
      type: 'saida',
      quantity: item.quantity,
      reason: 'Baixa automática por pedido',
      reference: order.orderNumber,
      previousStock: previous,
      newStock: product.stock,
      user: 'sistema',
    });
  }

  order.status = 'fulfilled';
  await order.save();
  res.json(order);
});

export default router;
