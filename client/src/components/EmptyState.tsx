import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6"
    >
      <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-corp-600/20 to-cyan-600/10 border border-corp-500/20 items-center justify-center mb-5 shadow-glow-sm">
        <Icon className="w-9 h-9 text-neon-blue" />
      </div>
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
