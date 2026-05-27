import { Router } from 'express';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
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

router.get('/catalog-pdf', async (_req, res) => {
  const products = await Product.find({ active: true }).populate('category', 'name').sort('name').lean();
  const categories = new Map<string, { name: string; items: any[] }>();

  for (const product of products) {
    const categoryName = (product.category as any)?.name || 'Sem categoria';
    if (!categories.has(categoryName)) categories.set(categoryName, { name: categoryName, items: [] });
    categories.get(categoryName)!.items.push(product);
  }

  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  doc.on('pageAdded', () => {
    doc.fontSize(9).fillColor('#64748b').text(`Página ${doc.bufferedPageRange().count}`, 0, 810, {
      align: 'center',
    });
  });

  doc.fontSize(24).fillColor('#0f172a').text('Catálogo Comercial');
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor('#334155').text('eSentinel • Catálogo digital de produtos');
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor('#64748b')
    .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`);
  doc.moveDown(1.2);

  doc.fontSize(13).fillColor('#0f172a').text('Sumário');
  doc.moveDown(0.3);
  for (const [name, group] of categories) {
    doc.fontSize(10).fillColor('#334155').text(`${name} (${group.items.length} itens)`);
  }

  for (const [name, group] of categories) {
    doc.addPage();
    doc.fontSize(16).fillColor('#0f172a').text(name);
    doc.moveDown(0.5);
    for (const item of group.items) {
      doc.fontSize(12).fillColor('#111827').text(item.name);
      doc
        .fontSize(10)
        .fillColor('#475569')
        .text(`SKU: ${item.sku || '-'}   |   Preço: R$ ${Number(item.price || 0).toFixed(2).replace('.', ',')}`);
      if (item.description) {
        doc.fontSize(9).fillColor('#64748b').text(item.description, { width: 500 });
      }
      doc.moveDown(0.6);
      if (doc.y > 740) {
        doc.addPage();
      }
    }
  }

  doc.end();

  doc.on('end', () => {
    const pdf = Buffer.concat(chunks);
    res.setHeader('Content-Disposition', 'attachment; filename="catalogo-comercial.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  });
});

export default router;
