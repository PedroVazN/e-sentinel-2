import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Factory, Trash2, Image as ImageIcon, Calendar, Hash, User, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Manufacturing as ManufacturingT, Product, Paginated } from '@/types';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export default function Manufacturing() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product: '',
    quantity: '',
    batchCode: '',
    productionDate: new Date().toISOString().slice(0, 10),
    expirationDate: '',
    operator: '',
    cost: '',
    notes: '',
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['manufacturing'],
    queryFn: async () =>
      (await api.get<Paginated<ManufacturingT>>('/manufacturing', { params: { limit: 100 } })).data,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { limit: 200 } })).data,
  });

  const products = productsData?.data || [];

  const mut = useMutation({
    mutationFn: async () => (await api.post('/manufacturing', form)).data,
    onSuccess: () => {
      toast.success('Fabricação registrada e estoque atualizado!');
      qc.invalidateQueries({ queryKey: ['manufacturing'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      setOpen(false);
      setForm({
        product: '',
        quantity: '',
        batchCode: '',
        productionDate: new Date().toISOString().slice(0, 10),
        expirationDate: '',
        operator: '',
        cost: '',
        notes: '',
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/manufacturing/${id}`)).data,
    onSuccess: () => {
      toast.success('Registro estornado e estoque ajustado');
      qc.invalidateQueries({ queryKey: ['manufacturing'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product) return toast.error('Selecione um produto');
    if (!form.quantity || Number(form.quantity) <= 0)
      return toast.error('Informe a quantidade fabricada');
    mut.mutate();
  };

  const totalUnits = records?.data.reduce((acc, r) => acc + r.quantity, 0) || 0;
  const totalRecords = records?.data.length || 0;
  const totalCost = records?.data.reduce((acc, r) => acc + (r.cost || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-corp-600 to-corp-700 grid place-items-center text-white shadow-glow-sm mb-3">
            <Factory className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lotes Registrados</p>
          <p className="text-2xl font-bold text-white mt-1">{formatNumber(totalRecords)}</p>
        </div>
        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center text-white shadow-lg mb-3">
            <Hash className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidades Fabricadas</p>
          <p className="text-2xl font-bold text-white mt-1">{formatNumber(totalUnits)}</p>
        </div>
        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center text-white shadow-lg mb-3">
            <Coins className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Custo Total</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalCost)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Histórico de Fabricação</h3>
          <p className="text-sm text-slate-500">
            Cada lote é registrado e adicionado automaticamente ao estoque do produto
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Registrar Fabricação
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !records?.data.length ? (
          <EmptyState
            icon={Factory}
            title="Nenhuma fabricação registrada"
            description="Tudo que for fabricado entrará automaticamente no estoque"
            action={
              <button onClick={() => setOpen(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Primeira Fabricação
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Lote</th>
                  <th>Produção</th>
                  <th>Validade</th>
                  <th>Operador</th>
                  <th>Custo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.data.map((r) => {
                  const product = typeof r.product === 'object' ? r.product : null;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="flex items-center gap-2 min-w-[180px]">
                          {product?.images?.[0] ? (
                            <img src={product.images[0].url} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-white/[0.06] grid place-items-center">
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <span className="font-medium text-white">{product?.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">+{r.quantity}</span>
                      </td>
                      <td className="text-xs">{r.batchCode || '—'}</td>
                      <td className="text-xs whitespace-nowrap">{formatDate(r.productionDate)}</td>
                      <td className="text-xs whitespace-nowrap">
                        {r.expirationDate ? formatDate(r.expirationDate) : '—'}
                      </td>
                      <td className="text-xs">{r.operator || '—'}</td>
                      <td className="text-xs">{r.cost ? formatCurrency(r.cost) : '—'}</td>
                      <td>
                        <button
                          onClick={() => {
                            if (confirm('Estornar esta fabricação? O estoque será reduzido.'))
                              deleteMut.mutate(r._id);
                          }}
                          className="p-2 rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
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
        title="Registrar Fabricação"
        description="As unidades produzidas serão adicionadas automaticamente ao estoque"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
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
                    {p.name} (estoque: {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantidade Produzida *</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Código do Lote</label>
              <input
                value={form.batchCode}
                onChange={(e) => setForm({ ...form, batchCode: e.target.value })}
                className="input"
                placeholder="Ex: L20260525"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data de Produção
              </label>
              <input
                type="date"
                value={form.productionDate}
                onChange={(e) => setForm({ ...form, productionDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Validade
              </label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1">
                <User className="w-3 h-3" /> Operador
              </label>
              <input
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
                className="input"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1">
                <Coins className="w-3 h-3" /> Custo Total (R$)
              </label>
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
            <div className="sm:col-span-2">
              <label className="label">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input min-h-[70px]"
                placeholder="Notas sobre a produção"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending} className="btn-primary flex-1">
              {mut.isPending ? 'Salvando...' : 'Registrar e Atualizar Estoque'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
