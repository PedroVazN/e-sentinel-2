import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from './motion';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  trend?: string;
  variant?: 'blue' | 'cyan' | 'violet' | 'amber' | 'rose';
  delay?: number;
}

const variants = {
  blue: {
    icon: 'from-corp-600 to-corp-700',
    glow: 'shadow-[0_0_30px_-8px_rgba(37,99,235,0.5)]',
    accent: 'text-corp-400',
  },
  cyan: {
    icon: 'from-cyan-600 to-teal-600',
    glow: 'shadow-[0_0_30px_-8px_rgba(34,211,238,0.4)]',
    accent: 'text-neon-cyan',
  },
  violet: {
    icon: 'from-violet-600 to-purple-700',
    glow: 'shadow-[0_0_30px_-8px_rgba(167,139,250,0.4)]',
    accent: 'text-neon-violet',
  },
  amber: {
    icon: 'from-amber-500 to-orange-600',
    glow: 'shadow-[0_0_30px_-8px_rgba(245,158,11,0.4)]',
    accent: 'text-amber-400',
  },
  rose: {
    icon: 'from-rose-600 to-pink-700',
    glow: 'shadow-[0_0_30px_-8px_rgba(244,63,94,0.4)]',
    accent: 'text-rose-400',
  },
};

export default function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  variant = 'blue',
  delay = 0,
}: Props) {
  const v = variants[variant];
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="card-hover p-5 group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl grid place-items-center text-white bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
            v.icon,
            v.glow
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</p>
      {hint && <p className={cn('text-xs mt-1.5', v.accent)}>{hint}</p>}
    </motion.div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="skeleton w-12 h-12 rounded-2xl" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-7 w-3/4 rounded" />
    </div>
  );
}
