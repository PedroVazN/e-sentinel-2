import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Factory,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  CircleDollarSign,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { DashboardData } from '@/types';
import KpiCard from '@/components/ui/KpiCard';
import { AnimatedPage, FadeIn } from '@/components/ui/motion';
import GlassCard, { GlassCardHeader } from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils';
import { CHART } from '@/lib/chartTheme';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/dashboard')).data,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <div className="skeleton h-20 w-full max-w-lg rounded-2xl" />
        <GridSkeleton count={4} />
      </div>
    );
  }

  const days: Record<string, { date: string; entrada: number; saida: number; fabricacao: number }> = {};
  data.movementsByDay.forEach((m) => {
    const k = m._id.d;
    days[k] ||= { date: k, entrada: 0, saida: 0, fabricacao: 0 };
    if (m._id.type === 'entrada') days[k].entrada += m.total;
    if (m._id.type === 'saida') days[k].saida += m.total;
    if (m._id.type === 'fabricacao') days[k].fabricacao += m.total;
  });
  const chartData = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AnimatedPage className="space-y-8">
      <FadeIn>
        <PageHeader
          badge="Intelligence Dashboard"
          title="Visão Executiva"
          subtitle="Monitoramento em tempo real de produtos, estoque e fabricação com análise preditiva."
        />
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Produtos Ativos" value={formatNumber(data.totals.products)} icon={Package} variant="blue" delay={0} trend="Live" />
        <KpiCard label="Unidades em Estoque" value={formatNumber(data.totals.stockUnits)} icon={Boxes} hint="inventário total" variant="cyan" delay={0.05} />
        <KpiCard label="Valor em Estoque" value={formatCurrency(data.totals.stockValue)} icon={CircleDollarSign} hint={`Custo: ${formatCurrency(data.totals.stockCost)}`} variant="violet" delay={0.1} />
        <KpiCard label="Alertas Críticos" value={formatNumber(data.totals.lowStock + data.totals.outOfStock)} icon={AlertTriangle} hint={`${data.totals.outOfStock} esgotado(s)`} variant="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FadeIn delay={0.1} className="lg:col-span-2">
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-6 pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neon-cyan" />
                  Fluxo de Estoque
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Movimentações — últimos 30 dias</p>
              </div>
              <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" /> Tempo real
              </span>
            </div>
            {chartData.length === 0 ? (
              <div className="h-72 grid place-items-center text-sm text-slate-500">Sem movimentações no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.emerald} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART.emerald} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSaida" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.rose} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART.rose} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART.tooltip} />
                  <Area type="monotone" dataKey="entrada" stroke={CHART.emerald} strokeWidth={2} fill="url(#gEntrada)" name="Entrada" />
                  <Area type="monotone" dataKey="saida" stroke={CHART.rose} strokeWidth={2} fill="url(#gSaida)" name="Saída" />
                  <Area type="monotone" dataKey="fabricacao" stroke={CHART.blue} strokeWidth={2} fill="url(#gFab)" name="Fabricação" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.15}>
          <GlassCard>
            <GlassCardHeader title="Por Categoria" subtitle="Distribuição do catálogo" />
            {data.productsByCategory.length === 0 ? (
              <div className="h-52 grid place-items-center text-sm text-slate-500">Sem dados</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.productsByCategory} dataKey="count" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="transparent">
                      {data.productsByCategory.map((c, i) => (
                        <Cell key={i} fill={c.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3 max-h-36 overflow-y-auto">
                  {data.productsByCategory.map((c) => (
                    <div key={c.categoryId || c.name} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-white/[0.03]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-glow-sm" style={{ background: c.color }} />
                        <span className="truncate text-slate-300">{c.name}</span>
                      </div>
                      <span className="text-slate-500 text-xs font-mono shrink-0">{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FadeIn delay={0.2}>
          <GlassCard>
            <GlassCardHeader
              title="Movimentações Recentes"
              subtitle="Timeline de atividades"
              action={
                <Link to="/estoque" className="text-xs font-semibold text-corp-400 hover:text-neon-cyan flex items-center gap-1 transition-colors">
                  Ver tudo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <div className="space-y-1">
              {data.recentMovements.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">Nenhuma movimentação</p>
              ) : (
                data.recentMovements.map((m, i) => {
                  const product = typeof m.product === 'object' ? m.product : null;
                  const isIn = m.type === 'entrada' || m.type === 'fabricacao';
                  return (
                    <motion.div
                      key={m._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 border ${isIn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {isIn ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate group-hover:text-neon-blue transition-colors">{product?.name || 'Produto'}</p>
                        <p className="text-xs text-slate-500 capitalize">{m.type} · {formatDateTime(m.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm font-mono ${isIn ? 'text-emerald-400' : 'text-rose-400'}`}>{isIn ? '+' : '-'}{m.quantity}</p>
                        <p className="text-[10px] text-slate-600">→ {m.newStock}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.25}>
          <GlassCard>
            <GlassCardHeader
              title="Fabricação Inteligente"
              subtitle="Lotes produzidos recentemente"
              action={
                <Link to="/fabricacao" className="text-xs font-semibold text-corp-400 hover:text-neon-cyan flex items-center gap-1 transition-colors">
                  Ver tudo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <div className="space-y-1">
              {data.recentManufacturings.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">Nenhuma fabricação</p>
              ) : (
                data.recentManufacturings.map((r, i) => {
                  const product = typeof r.product === 'object' ? r.product : null;
                  return (
                    <motion.div
                      key={r._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl grid place-items-center bg-corp-500/10 text-corp-400 border border-corp-500/20 shrink-0">
                        <Factory className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{product?.name || 'Produto'}</p>
                        <p className="text-xs text-slate-500">{r.batchCode ? `Lote ${r.batchCode} · ` : ''}{formatDateTime(r.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-neon-cyan font-mono">+{r.quantity}</p>
                        <p className="text-[10px] text-slate-600">unidades</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </FadeIn>
      </div>

      {data.topProducts.length > 0 && (
        <FadeIn delay={0.3}>
          <GlassCard>
            <GlassCardHeader title="Top Performance" subtitle="Produtos com maior volume em estoque" action={<Sparkles className="w-4 h-4 text-neon-violet" />} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.topProducts.map((p, i) => (
                <motion.div
                  key={p._id}
                  whileHover={{ y: -4 }}
                  className="text-center p-4 rounded-2xl glass border border-white/[0.06] hover:border-corp-500/30 transition-all"
                >
                  <div className="text-3xl font-black neon-text">#{i + 1}</div>
                  <p className="font-semibold text-white text-sm mt-2 line-clamp-1">{p.name}</p>
                  <p className="text-2xl font-bold text-white mt-2 font-mono">{formatNumber(p.stock)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">unidades</p>
                  <p className="text-xs text-emerald-400 mt-1">{formatCurrency(p.price * p.stock)}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </FadeIn>
      )}
    </AnimatedPage>
  );
}
