import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { AttentionWidget } from '@/components/dashboard/attention-widget.component';
import { ModuleCard } from '@/components/dashboard/module-card.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { ADMIN_MODULES } from '@/constants/admin-modules.const';
import { useAuth } from '@/contexts/auth.context';
import { companiesQueryOptions } from '@/queries/company.queries';
import { tasksQueryOptions } from '@/queries/task.queries';
import type { AdminModule } from '@/types/admin-module.type';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import {
  getMyAttentionTasks,
  getStaleCompanies,
} from '@/utils/dashboard-insights.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
};

export const Route = createFileRoute('/_admin/')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(tasksQueryOptions()),
      context.queryClient.ensureQueryData(companiesQueryOptions()),
    ]),
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

  const { data: tasks } = useSuspenseQuery(tasksQueryOptions());
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());

  const [now] = useState(() => Date.now());
  const myTasks = useMemo(
    () => getMyAttentionTasks(tasks, companies, userProfile?.uid ?? '', now),
    [tasks, companies, userProfile?.uid, now],
  );
  const staleCompanies = useMemo(
    () => getStaleCompanies(companies, tasks, 7, now),
    [companies, tasks, now],
  );

  return (
    <AdminPageContainer>
      {/* Hero */}
      <div className="mb-8 text-center sm:mb-12">
        <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
          Bem-vindo,
          {userProfile?.name ? ` ${userProfile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
          Sistema operacional Guará. Tudo conectado em um só lugar.
        </p>
      </div>

      <AttentionWidget
        taskCount={myTasks.length}
        staleCompanies={staleCompanies}
      />

      {/* Sections */}
      <div className="space-y-8 sm:space-y-10">
        {ADMIN_MODULES.map((section) => (
          <div key={section.label}>
            <div className="mb-3 sm:mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {section.label}
              </h2>
              <span className="text-[11px] text-text-muted sm:text-[12px]">
                {section.description}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {section.modules
                .filter((mod) => !isDisabled(mod))
                .map((mod) => (
                  <ModuleCard key={mod.label} module={mod} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </AdminPageContainer>
  );
}
