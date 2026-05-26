import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Upload,
  Download,
  Image as ImageIcon,
  X,
  Eye,
  Grid3x3,
  List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Category, Product, Paginated, ProductImage } from '@/types';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import ImageUploader from '@/components/ImageUploader';
import { AnimatedPage } from '@/components/ui/motion';
import PageHeader from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface FormState {
  sku: string;
  name: string;
  description: string;
  fragrance: string;
  format: string;
  netWeight: string;
  color: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  images: ProductImage[];
}

const empty: FormState = {
  sku: '',
  name: '',
  description: '',
  fragrance: '',
  format: '',
  netWeight: '',
  color: '',
  category: '',
  price: '',
  cost: '',
  stock: '',
  minStock: '',
  images: [],
};

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [importOpen, setImportOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const filters = useMemo(() => {
    const f: any = {};
    if (search) f.search = search;
    if (categoryFilter) f.category = categoryFilter;
    if (stockFilter === 'inStock') f.inStock = 'true';
    if (stockFilter === 'lowStock') f.lowStock = 'true';
    return f;
  }, [search, categoryFilter, stockFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { ...filters, limit: 100 } })).data,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (stockFilter === 'outOfStock') return data.data.filter((p) => p.stock === 0);
    return data.data;
  }, [data, stockFilter]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const saveMut = useMutation({
    mutationFn: async (payload: any) =>
      editing
        ? (await api.put(`/products/${editing._id}`, payload)).data
        : (await api.post('/products', payload)).data,
    onSuccess: () => {
      toast.success(editing ? 'Produto atualizado!' : 'Produto cadastrado!');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => {
      toast.success('Produto excluído');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openForm = (product?: Product) => {
    if (product) {
      setEditing(product);
      setForm({
        sku: product.sku || '',
        name: product.name,
        description: product.description,
        fragrance: product.fragrance,
        format: product.format,
        netWeight: product.netWeight,
        color: product.color,
        category: typeof product.category === 'object' ? product.category?._id || '' : product.category || '',
        price: String(product.price || ''),
        cost: String(product.cost || ''),
        stock: String(product.stock || ''),
        minStock: String(product.minStock || ''),
        images: product.images,
      });
    } else {
      setEditing(null);
      setForm(empty);
    }
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
    setForm(empty);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Informe o nome do produto');
    const payload: any = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      fragrance: form.fragrance,
      format: form.format,
      netWeight: form.netWeight,
      color: form.color,
      category: form.category || null,
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      minStock: Number(form.minStock) || 0,
      images: form.images,
    };
    if (!editing) payload.stock = Number(form.stock) || 0;
    saveMut.mutate(payload);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/products/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { criados, totalLinhas, erros } = res.data;
      toast.success(`${criados} de ${totalLinhas} produto(s) importado(s)`);
      if (erros?.length) {
        console.warn('Erros na importação:', erros);
        toast.error(`${erros.length} linha(s) com erro - veja o console`);
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setImportOpen(false);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        badge="Catálogo Premium"
        title="Produtos"
        subtitle="Gestão inteligente do catálogo com importação em massa e galeria multimídia."
        action={
          <>
            <button onClick={() => setImportOpen(true)} className="btn-secondary">
              <Upload className="w-4 h-4" /> Importar
            </button>
            <button onClick={() => openForm()} className="btn-primary">
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          </>
        }
      />

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 glass rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, SKU, fragrância..."
            className="bg-transparent outline-none text-sm flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 hover:bg-slate-200 rounded">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">Todas categorias</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="input w-auto"
        >
          <option value="all">Todo estoque</option>
          <option value="inStock">Com estoque</option>
          <option value="lowStock">Estoque baixo</option>
          <option value="outOfStock">Sem estoque</option>
        </select>
        <div className="flex glass rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-corp-600/30 text-neon-blue shadow-glow-sm-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-corp-600/30 text-neon-blue shadow-glow-sm-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-72 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title={search || categoryFilter || stockFilter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto'}
            description={
              search || categoryFilter || stockFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Cadastre o primeiro produto ou importe via Excel'
            }
            action={
              <div className="flex gap-2 justify-center">
                <button onClick={() => setImportOpen(true)} className="btn-secondary">
                  <Upload className="w-4 h-4" /> Importar Excel
                </button>
                <button onClick={() => openForm()} className="btn-primary">
                  <Plus className="w-4 h-4" /> Novo Produto
                </button>
              </div>
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onEdit={() => openForm(p)}
              onDelete={() => {
                if (confirm(`Excluir produto "${p.name}"?`)) deleteMut.mutate(p._id);
              }}
              onPreview={(url) => setPreviewImg(url)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const cat = typeof p.category === 'object' ? p.category : null;
                  const lowStock = p.stock <= p.minStock;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {p.images[0] ? (
                            <img
                              src={p.images[0].url}
                              className="w-10 h-10 rounded-lg object-cover cursor-pointer"
                              onClick={() => setPreviewImg(p.images[0].url)}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/[0.06] grid place-items-center">
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{p.name}</p>
                            {p.fragrance && <p className="text-xs text-slate-500">{p.fragrance}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-slate-500">{p.sku || '—'}</td>
                      <td>
                        {cat ? (
                          <span className="badge" style={{ background: cat.color + '20', color: cat.color }}>
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Sem categoria</span>
                        )}
                      </td>
                      <td className="font-semibold">{formatCurrency(p.price)}</td>
                      <td>
                        <span
                          className={`badge ${
                            p.stock === 0
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : lowStock
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {p.stock} un
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openForm(p)} className="p-2 rounded-lg hover:bg-white/[0.06]">
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir produto "${p.name}"?`)) deleteMut.mutate(p._id);
                            }}
                            className="p-2 rounded-lg hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={closeForm}
        title={editing ? 'Editar Produto' : 'Cadastrar Produto'}
        description="Preencha os dados (todos os campos são opcionais exceto o nome)"
        size="lg"
      >
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome do Produto *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="Ex: Sabonete Lavanda"
                  />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input"
                    placeholder="Código"
                  />
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Descrição do produto"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fragrância</label>
                  <input
                    value={form.fragrance}
                    onChange={(e) => setForm({ ...form, fragrance: e.target.value })}
                    className="input"
                    placeholder="Ex: Lavanda"
                  />
                </div>
                <div>
                  <label className="label">Formato</label>
                  <input
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="input"
                    placeholder="Ex: Barra, Pote"
                  />
                </div>
                <div>
                  <label className="label">Peso Líquido</label>
                  <input
                    value={form.netWeight}
                    onChange={(e) => setForm({ ...form, netWeight: e.target.value })}
                    className="input"
                    placeholder="Ex: 90g"
                  />
                </div>
                <div>
                  <label className="label">Coloração</label>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="input"
                    placeholder="Ex: Roxo"
                  />
                </div>
              </div>
              <div>
                <label className="label">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  <option value="">Sem categoria</option>
                  {categories?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="input"
                    placeholder="0,00"
                  />
                </div>
                {!editing && (
                  <div>
                    <label className="label">Estoque Inicial</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                )}
                <div>
                  <label className="label">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Fotos do Produto</label>
              <ImageUploader
                images={form.images}
                onChange={(images) => setForm({ ...form, images })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saveMut.isPending} className="btn-primary flex-1">
              {saveMut.isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar Produtos via Excel"
        description="Faça o upload de um arquivo .xlsx para cadastrar múltiplos produtos de uma vez"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-corp-500/10 border border-corp-500/20 p-4">
            <h4 className="font-semibold text-white text-sm mb-2">Como funciona</h4>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Baixe o modelo, preencha e importe</li>
              <li>Categorias inexistentes serão criadas automaticamente</li>
              <li>Os produtos são cadastrados sem ordem específica</li>
              <li>O estoque inicial gera uma movimentação de entrada</li>
            </ul>
          </div>
          <a
            href="/api/products/export/template"
            download
            className="btn-secondary w-full"
          >
            <Download className="w-4 h-4" /> Baixar Modelo (.xlsx)
          </a>
          <input
            ref={importInput}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
          <button
            onClick={() => importInput.current?.click()}
            disabled={importing}
            className="btn-primary w-full"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importando...' : 'Selecionar arquivo Excel'}
          </button>
        </div>
      </Modal>

      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur grid place-items-center p-4 animate-fade-in"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImg}
            alt=""
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AnimatedPage>
  );
}

function ProductCard({
  product: p,
  onEdit,
  onDelete,
  onPreview,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: (url: string) => void;
}) {
  const cat = typeof p.category === 'object' ? p.category : null;
  const lowStock = p.stock <= p.minStock && p.stock > 0;
  const outStock = p.stock === 0;
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    setImgIdx(0);
  }, [p._id]);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="card-hover overflow-hidden group flex flex-col"
    >
      <div className="relative aspect-square bg-void-200 overflow-hidden">
        {p.images.length > 0 ? (
          <>
            <img
              src={p.images[imgIdx].url}
              alt={p.name}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
              onClick={() => onPreview(p.images[imgIdx].url)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-60" />
            {p.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {p.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIdx(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-neon-cyan w-5' : 'bg-white/40 w-1.5'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full grid place-items-center bg-white/[0.02]">
            <ImageIcon className="w-12 h-12 text-slate-600" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-10">
          {p.images[0] && (
            <button onClick={() => onPreview(p.images[imgIdx].url)} className="p-2 rounded-xl glass hover:bg-white/10 text-white">
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button onClick={onEdit} className="p-2 rounded-xl glass hover:bg-white/10 text-white">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl glass hover:bg-rose-500/100/20 text-rose-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {cat && (
          <span className="absolute top-3 left-3 badge backdrop-blur-md border border-white/10 z-10" style={{ background: cat.color + 'cc', color: 'white' }}>
            {cat.name}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-white line-clamp-1 tracking-tight">{p.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1.5 mb-2 min-h-[20px]">
          {p.fragrance && <span className="text-xs text-slate-500">{p.fragrance}</span>}
          {p.netWeight && <span className="text-xs text-slate-600">· {p.netWeight}</span>}
          {p.format && <span className="text-xs text-slate-600">· {p.format}</span>}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(p.price)}</p>
          <span className={`badge ${outStock ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : lowStock ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {formatNumber(p.stock)} un
          </span>
        </div>
      </div>
    </motion.div>
  );
}
