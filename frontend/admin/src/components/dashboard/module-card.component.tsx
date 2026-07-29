import { Link } from '@tanstack/react-router';

import type { AdminModule } from '@/types/admin-module.type';

interface ModuleCardProps {
  module: AdminModule;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const inner = (
    <>
      <div className="module-card-icon">
        <module.icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text">
            {module.label}
          </span>
          {module.soon && <span className="module-card-badge">em breve</span>}
        </div>
        <p className="mt-0.5 text-[12px] text-text-muted">
          {module.description}
        </p>
      </div>
    </>
  );

  if (module.to) {
    return (
      <Link to={module.to} disabled={module.soon} className="module-card is-linked">
        {inner}
      </Link>
    );
  }

  return <div className="module-card is-disabled">{inner}</div>;
}
