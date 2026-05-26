import { Router } from 'express';
import * as XLSX from 'xlsx';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { Manufacturing } from '../models/Manufacturing';

const router = Router();

router.get('/stock', async (_req, res) => {
  const products = await Product.find().populate('category', 'name').sort('name');
  const wb = XLSX.utils.book_new();
  const data = products.map((p) => ({
    Nome: p.name,
    SKU: p.sku || '',
    Categoria: (p.category as any)?.name || 'Sem categoria',
    Fragrância: p.fragrance || '',
    Formato: p.format || '',
    'Peso Líquido': p.netWeight || '',
    Coloração: p.color || '',
    Preço: p.price,
    Custo: p.cost,
    Estoque: p.stock,
    'Estoque Mínimo': p.minStock,
    'Valor em Estoque': (p.stock * p.price).toFixed(2),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-estoque.xlsx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buf);
});

router.get('/movements', async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  const filter: any = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const movements = await StockMovement.find(filter).populate('product', 'name sku').sort('-createdAt');
  const wb = XLSX.utils.book_new();
  const data = movements.map((m: any) => ({
    Data: new Date(m.createdAt).toLocaleString('pt-BR'),
    Tipo: m.type,
    Produto: m.product?.name || '',
    SKU: m.product?.sku || '',
    Quantidade: m.quantity,
    'Estoque Anterior': m.previousStock,
    'Estoque Atual': m.newStock,
    Motivo: m.reason,
    Referência: m.reference,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-movimentacoes.xlsx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buf);
});

router.get('/manufacturing', async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  const filter: any = {};
  if (from || to) {
    filter.productionDate = {};
    if (from) filter.productionDate.$gte = new Date(from);
    if (to) filter.productionDate.$lte = new Date(to);
  }
  const records = await Manufacturing.find(filter).populate('product', 'name sku').sort('-productionDate');
  const wb = XLSX.utils.book_new();
  const data = records.map((r: any) => ({
    Data: new Date(r.productionDate).toLocaleDateString('pt-BR'),
    Produto: r.product?.name || '',
    SKU: r.product?.sku || '',
    Quantidade: r.quantity,
    Lote: r.batchCode,
    Validade: r.expirationDate ? new Date(r.expirationDate).toLocaleDateString('pt-BR') : '',
    Operador: r.operator,
    'Custo Total': r.cost,
    Observações: r.notes,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Fabricação');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-fabricacao.xlsx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buf);
});

router.get('/prices', async (_req, res) => {
  const products = await Product.find().populate('category', 'name').sort('name');
  const wb = XLSX.utils.book_new();
  const data = products.map((p: any) => ({
    Nome: p.name,
    SKU: p.sku || '',
    Categoria: p.category?.name || '',
    Fragrância: p.fragrance || '',
    'Peso Líquido': p.netWeight || '',
    Custo: p.cost,
    Preço: p.price,
    'Margem (%)': p.cost ? (((p.price - p.cost) / p.cost) * 100).toFixed(1) : '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Tabela de Preços');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="tabela-precos.xlsx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buf);
});

export default router;
