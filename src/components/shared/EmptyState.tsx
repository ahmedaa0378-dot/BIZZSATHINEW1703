import { Video as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
        <Icon size={32} className="text-slate-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6 max-w-xs">
        {subtitle}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all active:scale-[0.98] min-h-[48px]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
