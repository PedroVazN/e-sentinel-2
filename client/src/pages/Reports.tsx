import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  FileSpreadsheet,
  Boxes,
  Factory,
  ArrowDownUp,
  CircleDollarSign,
  AlertTriangle,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import { DashboardData, Paginated, Product } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function Reports() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/dashboard')).data,
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'reports'],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { limit: 200 } })).data,
  });

  const lowStockItems = products?.data.filter((p) => p.stock <= p.minStock) || [];

  const downloads = [
    {
      title: 'Estoque Atual',
      description: 'Snapshot completo dos produtos e quantidades',
      icon: Boxes,
      color: 'from-emerald-500 to-emerald-700',
      url: '/api/reports/stock',
    },
    {
      title: 'Movimentações',
      description: 'Entradas, saídas e ajustes no período',
      icon: ArrowDownUp,
      color: 'from-sky-500 to-cyan-600',
      url: `/api/reports/movements?from=${from}&to=${to}`,
    },
    {
      title: 'Fabricação',
      description: 'Lotes produzidos com lote, validade e custo',
      icon: Factory,
      color: 'from-corp-600 to-corp-700',
      url: `/api/reports/manufacturing?from=${from}&to=${to}`,
    },
    {
      title: 'Tabela de Preços',
      description: 'Custo, preço, margem e estoque',
      icon: CircleDollarSign,
      color: 'from-amber-500 to-orange-600',
      url: '/api/reports/prices',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-corp-400" /> Período dos Relatórios
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">De</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Até</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {downloads.map((d) => (
          <a
            key={d.title}
            href={d.url}
            download
            className="card p-5 hover:shadow-lg transition-all group"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${d.color} grid place-items-center text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}
            >
              <d.icon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white">{d.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{d.description}</p>
            <div className="mt-3 flex items-center gap-1 text-sm text-corp-400 font-medium">
              <Download className="w-4 h-4" /> Baixar Excel
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-bold text-white mb-1">Fabricação Diária</h3>
          <p className="text-xs text-slate-500 mb-4">Unidades produzidas nos últimos 30 dias</p>
          {!dash?.manufacturingByDay.length ? (
            <div className="h-60 grid place-items-center text-sm text-slate-500">
              Sem dados de fabricação
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dash.manufacturingByDay.map((d) => ({ date: d._id.slice(5), total: d.total }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={12} stroke="#94a3b8" />
                <YAxis fontSize={12} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v: any) => [v, 'Unidades']}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas de Estoque
          </h3>
          <p className="text-xs text-slate-500 mb-4">{lowStockItems.length} produto(s) precisam de atenção</p>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 items-center justify-center mb-2">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-600">Tudo em ordem! Nenhum produto com estoque baixo.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lowStockItems.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.images[0] ? (
                      <img src={p.images[0].url} className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-white grid place-items-center">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">Mínimo: {p.minStock}</p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {p.stock} un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {dash?.topProducts && dash.topProducts.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-white mb-4">Top Produtos em Estoque</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {dash.topProducts.map((p, i) => (
              <div key={p._id} className="text-center p-4 rounded-2xl bg-white/[0.03]">
                <div className="text-2xl font-bold text-corp-400">#{i + 1}</div>
                <p className="font-medium text-white text-sm mt-2 line-clamp-1">{p.name}</p>
                <p className="text-xl font-bold text-white mt-2">{formatNumber(p.stock)}</p>
                <p className="text-xs text-slate-500">unidades</p>
                <p className="text-xs text-emerald-600 mt-1">{formatCurrency(p.price * p.stock)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
