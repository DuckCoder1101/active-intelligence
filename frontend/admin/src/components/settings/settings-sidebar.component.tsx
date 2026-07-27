import { Link } from '@tanstack/react-router';
import type { ElementType } from 'react';
import { MdOutlineCategory } from 'react-icons/md';

interface SettingsModule {
  icon: ElementType;
  label: string;
  to: '/settings/task-categories';
}

// Só entram aqui módulos que já têm configuração própria de verdade — o
// dashboard do admin já mostra "em breve" pros módulos que ainda não têm
// (ver ADMIN_MODULES); não precisa duplicar isso na sidebar.
const MODULES: SettingsModule[] = [
  {
    icon: MdOutlineCategory,
    label: 'Categorias de Tarefa',
    to: '/settings/task-categories',
  },
];

export function SettingsSidebar() {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-card px-2 py-3">
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.5px] text-text-muted">
        Módulos
      </p>
      {MODULES.map(({ icon: Icon, label, to }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-text-sub transition-colors hover:bg-bg hover:text-text [&.active]:bg-orange/10 [&.active]:text-orange"
          activeProps={{ className: 'active' }}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </div>
  );
}
