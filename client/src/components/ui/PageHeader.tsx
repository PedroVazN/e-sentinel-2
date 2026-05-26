import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  action,
  badge,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 badge bg-corp-500/10 text-corp-400 border border-corp-500/20 mb-3">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        )}
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-xl">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
