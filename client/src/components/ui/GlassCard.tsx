import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  padding?: boolean;
}

export default function GlassCard({ children, className, glow, padding = true }: Props) {
  return (
    <div
      className={cn(
        'glass rounded-2xl shadow-card',
        glow && 'shadow-glow-sm border-corp-500/20',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 className="font-bold text-white text-lg tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
