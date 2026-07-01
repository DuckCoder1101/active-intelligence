import { createFileRoute } from '@tanstack/react-router';

import { ModuleCard } from '@/components/dashboard/module-card.component';
import { AdminPageContainer } from '@/components/layout/page-container.component';
import { ADMIN_MODULES } from '@/constants/admin-modules.const';
import { useAuth } from '@/contexts/auth.context';
import type { AdminModule } from '@/types/admin-module.type';

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { userProfile, claims } = useAuth();

  const isOwner = claims?.accessLevel === 'owner';
  const userPermissions =
    claims && 'permissions' in claims ? (claims.permissions ?? []) : [];

  const isDisabled = (mod: AdminModule) => {
    if (isOwner || !mod.permission) {
      return false;
    }
    return !userPermissions.includes(mod.permission);
  };

  return (
    <AdminPageContainer>
      {/* Hero */}
      <div className="mb-8 text-center sm:mb-12">
        <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
          Bem-vindo ao{' '}
          <span className="text-orange">
            Active OS
            {userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}
          </span>
        </h1>
        <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
          Sistema operacional Active. Tudo conectado em um só lugar.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 sm:space-y-10">
        {ADMIN_MODULES.map((section) => (
          <div key={section.label}>
            <div className="mb-3 sm:mb-4">
              <h2 className="text-[16px] font-bold text-text sm:text-[18px]">
                {section.label}
              </h2>
              <span className="text-[11px] text-text-muted sm:text-[12px]">
                {section.description}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {section.modules.map((mod) => (
                <ModuleCard
                  key={mod.label}
                  module={mod}
                  disabled={isDisabled(mod)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminPageContainer>
  );
}
