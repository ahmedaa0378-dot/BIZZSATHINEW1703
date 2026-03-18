import { Home, ArrowUpDown, Package, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../lib/i18n';

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const TABS = [
    { path: '/', label: t('tab_home'), icon: Home },
    { path: '/transactions', label: t('tab_transactions'), icon: ArrowUpDown },
    { path: '/stock', label: t('tab_stock'), icon: Package },
    { path: '/more', label: t('tab_more'), icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom
      bg-white/90 backdrop-blur-xl border-t border-neutral-200/60
      dark:bg-[#0a0a0a]/90 dark:backdrop-blur-xl dark:border-white/5">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-[68px] px-2">
        {TABS.map((tab, i) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 pt-1 pb-0.5 transition-all duration-200',
                i === 1 && 'mr-6',
                i === 2 && 'ml-6',
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.8}
                className={cn(
                  'transition-colors duration-200',
                  active ? 'text-[#9abf2a]' : 'text-neutral-400 dark:text-zinc-600'
                )}
              />
              <span className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                active ? 'text-[#8fb02e] dark:text-[#c8ee44]' : 'text-neutral-400 dark:text-zinc-600'
              )}>
                {tab.label}
              </span>
              <span className={cn(
                'w-1 h-1 rounded-full transition-all duration-300',
                active ? 'bg-accent scale-100' : 'scale-0'
              )} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}