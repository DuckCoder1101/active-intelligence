import { Link } from '@tanstack/react-router';
import { MdLockOutline } from 'react-icons/md';

import type { AdminModule } from '@/types/admin-module.type';

interface ModuleCardProps {
  module: AdminModule;
  disabled?: boolean;
}

export function ModuleCard({ module, disabled = false }: ModuleCardProps) {
  const inner = (
    <>
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          disabled ? 'bg-border/60' : 'bg-orange/10',
        ].join(' ')}
      >
        <module.icon
          size={22}
          className={disabled ? 'text-text-muted' : 'text-orange'}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              'text-[13px] font-semibold',
              disabled ? 'text-text-muted' : 'text-text',
            ].join(' ')}
          >
            {module.label}
          </span>
          {module.soon && !disabled && (
            <span className="rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-bold text-orange">
              em breve
            </span>
          )}
          {disabled && <MdLockOutline size={13} className="text-text-muted" />}
        </div>
        <p className="mt-0.5 text-[12px] text-text-muted">{module.description}</p>
      </div>
    </>
  );

  const base =
    'flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 transition-all';

  if (!disabled && module.to) {
    return (
      <Link
        to={module.to}
        className={`${base} hover:shadow-md hover:-translate-y-0.5`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`${base} ${disabled ? 'cursor-not-allowed opacity-50' : 'opacity-80'}`}
    >
      {inner}
    </div>
  );
}
