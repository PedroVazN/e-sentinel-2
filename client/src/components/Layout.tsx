import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  Factory,
  FileBarChart,
  CircleDollarSign,
  Menu,
  X,
  Sparkles,
  Search,
  Bell,
  Zap,
  ChevronRight,
  ShoppingCart,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão analítica' },
  { to: '/produtos', label: 'Produtos', icon: Package, desc: 'Catálogo premium' },
  { to: '/categorias', label: 'Categorias', icon: Tags, desc: 'Organização' },
  { to: '/estoque', label: 'Estoque', icon: Boxes, desc: 'Controle total' },
  { to: '/fabricacao', label: 'Fabricação', icon: Factory, desc: 'Produção inteligente' },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart, desc: 'Vendas e status' },
  { to: '/compartilhar-catalogo', label: 'Link do Catálogo', icon: QrCode, desc: 'QR Code para clientes' },
  { to: '/precos', label: 'Tabela de Preços', icon: CircleDollarSign, desc: 'Pricing' },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart, desc: 'Business intel' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = nav.find((n) => location.pathname.startsWith(n.to));

  return (
    <div className="min-h-screen flex bg-void bg-mesh-dark">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-corp-600/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl animate-float" />
      </div>

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px] glass-strong transition-transform duration-300 flex flex-col shrink-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-corp grid place-items-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-void-100 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">eSentinel</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Enterprise AI
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Plataforma
          </p>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-gradient-to-r from-corp-600/20 to-cyan-600/10 text-white border border-corp-500/30 shadow-glow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-neon-blue to-neon-cyan rounded-full"
                      />
                    )}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-all',
                        isActive
                          ? 'bg-corp-600/30 text-neon-blue'
                          : 'bg-white/[0.04] text-slate-500 group-hover:text-slate-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{item.label}</span>
                      <span className="text-[10px] text-slate-600 group-hover:text-slate-500 hidden lg:block">
                        {item.desc}
                      </span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-corp-400 shrink-0" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-corp-600/20 to-cyan-600/10 border border-corp-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-neon opacity-5" />
            <div className="relative flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs font-bold text-white">Intelligence Engine</span>
            </div>
            <p className="text-[10px] text-slate-400 relative">Análise em tempo real ativa</p>
            <div className="mt-3 flex items-center gap-2 relative">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Online
              </span>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col relative">
        <header className="sticky top-0 z-20 glass-strong border-b border-white/[0.06]">
          <div className="flex items-center gap-4 px-4 lg:px-8 h-[68px]">
            <button
              className="lg:hidden p-2.5 rounded-xl glass hover:bg-white/[0.06] text-slate-300"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white text-lg tracking-tight truncate">
                {current?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                {current?.desc || 'Plataforma empresarial de gestão inteligente'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-2.5 w-72 group focus-within:border-corp-500/30 focus-within:shadow-glow-sm transition-all">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-corp-400 transition-colors" />
              <input
                placeholder="Busca inteligente..."
                className="bg-transparent outline-none text-sm flex-1 text-slate-200 placeholder:text-slate-600"
              />
              <kbd className="hidden lg:inline text-[10px] font-mono text-slate-600 bg-white/[0.05] px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>
            <button className="relative p-2.5 rounded-xl glass hover:bg-white/[0.06] transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-void" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-neon p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-void-100 grid place-items-center text-white font-bold text-sm">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
