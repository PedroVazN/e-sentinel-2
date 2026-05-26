import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Plus,
  Minus,
  Settings2,
  Factory,
  Image as ImageIcon,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Product, StockMovement, Paginated } from '@/types';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { formatDateTime, formatNumber } from '@/lib/utils';

type Action = 'entrada' | 'saida' | 'ajuste';

export default function Stock() {
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | StockMovement['type']>('all');
  const [filterProduct, setFilterProduct] = useState('');
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action>('entrada');
  const [form, setForm] = useState({
    product: '',
    quantity: '',
    newStock: '',
    reason: '',
    reference: '',
  });

  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock-movements', filterType, filterProduct],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (filterType !== 'all') params.type = filterType;
      if (filterProduct) params.product = filterProduct;
      return (await api.get<Paginated<StockMovement>>('/stock/movements', { params })).data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { limit: 200 } })).data,
  });

  const products = productsData?.data || [];

  const totals = useMemo(() => {
    const t = { entrada: 0, saida: 0, fabricacao: 0, ajuste: 0 };
    movements?.data.forEach((m) => {
      t[m.type] += m.quantity;
    });
    return t;
  }, [movements]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        product: form.product,
        reason: form.reason,
        reference: form.reference,
      };
      if (action === 'ajuste') {
        payload.newStock = Number(form.newStock);
      } else {
        payload.quantity = Number(form.quantity);
      }
      return (await api.post(`/stock/${action}`, payload)).data;
    },
    onSuccess: () => {
      toast.success('Movimentação registrada!');
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      setForm({ product: '', quantity: '', newStock: '', reason: '', reference: '' });
    },
  });

  const openAction = (a: Action) => {
    setAction(a);
    setForm({ product: '', quantity: '', newStock: '', reason: '', reference: '' });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product) return toast.error('Selecione um produto');
    if (action === 'ajuste' && form.newStock === '') return toast.error('Informe o novo estoque');
    if (action !== 'ajuste' && (!form.quantity || Number(form.quantity) <= 0))
      return toast.error('Informe uma quantidade válida');
    mut.mutate();
  };

  const renderIcon = (type: StockMovement['type']) => {
    if (type === 'entrada') return <ArrowUpRight className="w-5 h-5" />;
    if (type === 'saida') return <ArrowDownRight className="w-5 h-5" />;
    if (type === 'fabricacao') return <Factory className="w-5 h-5" />;
    return <Settings2 className="w-5 h-5" />;
  };

  const colorClass = (type: StockMovement['type']) => {
    if (type === 'entrada') return 'bg-emerald-500/10 text-emerald-400';
    if (type === 'saida') return 'bg-rose-500/10 text-rose-400';
    if (type === 'fabricacao') return 'bg-corp-500/10 text-corp-400';
    return 'bg-amber-500/10 text-amber-400';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => openAction('entrada')}
          className="card p-4 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <p className="font-semibold text-white text-sm">Entrada</p>
          <p className="text-xs text-slate-500">Adicionar ao estoque</p>
        </button>
        <button
          onClick={() => openAction('saida')}
          className="card p-4 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 grid place-items-center mb-2 group-hover:scale-110 transition-transform">
            <Minus className="w-5 h-5" />
          </div>
          <p className="font-semibold text-white text-sm">Saída</p>
          <p className="text-xs text-slate-500">Retirar do estoque</p>
        </button>
        <button
          onClick={() => openAction('ajuste')}
          className="card p-4 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 grid place-items-center mb-2 group-hover:scale-110 transition-transform">
            <Settings2 className="w-5 h-5" />
          </div>
          <p className="font-semibold text-white text-sm">Ajuste</p>
          <p className="text-xs text-slate-500">Inventário manual</p>
        </button>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] text-slate-600 grid place-items-center mb-2">
            <History className="w-5 h-5" />
          </div>
          <p className="font-semibold text-white text-sm">No período</p>
          <p className="text-xs text-emerald-600">+{formatNumber(totals.entrada + totals.fabricacao)} entradas</p>
          <p className="text-xs text-rose-600">-{formatNumber(totals.saida)} saídas</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="input w-auto"
        >
          <option value="all">Todas movimentações</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
          <option value="fabricacao">Fabricação</option>
          <option value="ajuste">Ajustes</option>
        </select>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="input w-auto flex-1 min-w-[200px]"
        >
          <option value="">Todos produtos</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !movements?.data.length ? (
          <EmptyState
            icon={Boxes}
            title="Nenhuma movimentação"
            description="Registre entradas, saídas ou ajustes para começar"
          />
        ) : (
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Anterior → Atual</th>
                  <th>Motivo</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {movements.data.map((m) => {
                  const product = typeof m.product === 'object' ? m.product : null;
                  return (
                    <tr key={m._id}>
                      <td>
                        <span
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${colorClass(
                            m.type
                          )}`}
                        >
                          {renderIcon(m.type)}
                          {m.type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {product?.images?.[0] ? (
                            <img src={product.images[0].url} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/[0.06] grid place-items-center">
                              <ImageIcon className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                          <span className="font-medium text-white">{product?.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`font-bold ${
                            m.type === 'entrada' || m.type === 'fabricacao'
                              ? 'text-emerald-600'
                              : m.type === 'saida'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {m.type === 'saida' ? '-' : '+'}
                          {m.quantity}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {m.previousStock} → <span className="text-white font-semibold">{m.newStock}</span>
                      </td>
                      <td className="text-sm text-slate-600 max-w-xs truncate">{m.reason || '—'}</td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(m.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          action === 'entrada'
            ? 'Registrar Entrada'
            : action === 'saida'
            ? 'Registrar Saída'
            : 'Ajustar Estoque'
        }
        description={
          action === 'ajuste'
            ? 'Define o estoque para um valor exato (inventário manual)'
            : 'Registra uma movimentação no histórico do produto'
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Produto *</label>
            <select
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              className="input"
              required
            >
              <option value="">Selecione um produto</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (estoque atual: {p.stock})
                </option>
              ))}
            </select>
          </div>
          {action === 'ajuste' ? (
            <div>
              <label className="label">Novo Estoque *</label>
              <input
                type="number"
                min="0"
                value={form.newStock}
                onChange={(e) => setForm({ ...form, newStock: e.target.value })}
                className="input"
                required
              />
            </div>
          ) : (
            <div>
              <label className="label">Quantidade *</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input"
                required
              />
            </div>
          )}
          <div>
            <label className="label">Motivo</label>
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input"
              placeholder={
                action === 'entrada'
                  ? 'Compra, devolução, etc.'
                  : action === 'saida'
                  ? 'Venda, perda, amostra, etc.'
                  : 'Inventário, correção, etc.'
              }
            />
          </div>
          <div>
            <label className="label">Referência</label>
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="input"
              placeholder="Nº pedido, NF, lote..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending} className="btn-primary flex-1">
              {mut.isPending ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
