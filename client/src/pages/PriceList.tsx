import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Image as ImageIcon, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { apiUrl } from '@/lib/apiBase';
import { Category, Product, Paginated } from '@/types';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { CircleDollarSign } from 'lucide-react';

export default function PriceList() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'price-list', search, categoryFilter],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      return (await api.get<Paginated<Product>>('/products', { params })).data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const products = data?.data || [];

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; color: string; items: Product[] }>();
    products.forEach((p) => {
      const cat = typeof p.category === 'object' ? p.category : null;
      const key = cat?._id || 'sem-categoria';
      if (!map.has(key)) {
        map.set(key, {
          name: cat?.name || 'Sem categoria',
          color: cat?.color || '#94a3b8',
          items: [],
        });
      }
      map.get(key)!.items.push(p);
    });
    return Array.from(map.values());
  }, [products]);

  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  const avgMargin =
    products.filter((p) => p.cost > 0).reduce((acc, p) => acc + ((p.price - p.cost) / p.cost) * 100, 0) /
    Math.max(1, products.filter((p) => p.cost > 0).length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-corp-600 to-corp-700 grid place-items-center text-white shadow-glow-sm mb-3">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Produtos Ativos</p>
          <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
        </div>
        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center text-white shadow-lg mb-3">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor em Estoque</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center text-white shadow-lg mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Margem Média</p>
          <p className="text-2xl font-bold text-white mt-1">
            {isFinite(avgMargin) ? avgMargin.toFixed(1) + '%' : '—'}
          </p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-transparent outline-none text-sm flex-1"
          />
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
        <a href={apiUrl('/reports/prices')} download className="btn-primary">
          <Download className="w-4 h-4" /> Exportar
        </a>
      </div>

      {isLoading ? (
        <div className="card p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CircleDollarSign}
            title="Nenhum produto encontrado"
            description="Cadastre produtos para gerar a tabela de preços"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.name} className="card overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ background: group.color + '15', borderBottom: `1px solid ${group.color}30` }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: group.color }} />
                  <h3 className="font-bold text-white">{group.name}</h3>
                  <span className="text-xs text-slate-500">{group.items.length} produto(s)</span>
                </div>
              </div>
              <div className="table-wrap !rounded-none !border-0">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Fragrância / Peso</th>
                      <th>Custo</th>
                      <th>Preço</th>
                      <th>Margem</th>
                      <th>Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((p) => {
                      const margin = p.cost ? ((p.price - p.cost) / p.cost) * 100 : null;
                      return (
                        <tr key={p._id}>
                          <td>
                            <div className="flex items-center gap-3 min-w-[200px]">
                              {p.images[0] ? (
                                <img src={p.images[0].url} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/[0.06] grid place-items-center">
                                  <ImageIcon className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-white">{p.name}</p>
                                {p.sku && <p className="text-xs text-slate-500">{p.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="text-xs text-slate-600">
                            {p.fragrance && <div>{p.fragrance}</div>}
                            {(p.netWeight || p.format) && (
                              <div className="text-slate-400">
                                {[p.netWeight, p.format].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>
                          <td className="text-sm text-slate-500">
                            {p.cost ? formatCurrency(p.cost) : '—'}
                          </td>
                          <td className="font-bold text-white">{formatCurrency(p.price)}</td>
                          <td>
                            {margin !== null ? (
                              <span
                                className={`badge ${
                                  margin >= 50
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : margin >= 20
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {margin.toFixed(1)}%
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                p.stock === 0
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : p.stock <= p.minStock
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {p.stock} un
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
