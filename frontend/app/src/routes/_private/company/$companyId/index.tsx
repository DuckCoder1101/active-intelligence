import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  MdOutlineHandshake,
  MdOutlinePeopleAlt,
  MdOutlineTrendingUp,
} from 'react-icons/md';

import { PerformancePanel } from '@/components/company/dashboard/performance-panel.component';
import { SalesFunnel } from '@/components/company/dashboard/sales-funnel.component';
import { StatCard } from '@/components/company/dashboard/stat-card.component';
import { TaskQuotaCard } from '@/components/company/dashboard/task-quota-card.component';
import { TodayActivitiesCard } from '@/components/company/dashboard/today-activities-card.component';
import { UpcomingScheduleCard } from '@/components/company/dashboard/upcoming-schedule-card.component';
import { WelcomeModal } from '@/components/company/dashboard/welcome-modal.component';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useIsFirstTime } from '@/hooks/use-is-first-time.hook';
import {
  crmColumnsQueryOptions,
  crmFunnelsQueryOptions,
  leadsQueryOptions,
} from '@/queries/company-crm.queries';
import { operationalKanbanColumnsQueryOptions } from '@/queries/operational-kanban.queries';
import { personalTasksQueryOptions } from '@/queries/personal-task.queries';
import {
  calendarTasksQueryOptions,
  clientTasksQueryOptions,
} from '@/queries/task.queries';
import {
  computeDailyLeadSeries,
  computeFunnel,
  computeLeadStats,
  computeWeeklyMetrics,
  getTasksOnDay,
  getUpcomingTasks,
} from '@/utils/dashboard-insights.util';

function nextMonthOf(date: Date): { year: number; month: number } {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}

export const Route = createFileRoute('/_private/company/$companyId/')({
  loader: async ({ context, params }) => {
    const today = new Date();
    const { year: nextYear, month: nextMonth } = nextMonthOf(today);

    const funnels = await context.queryClient.ensureQueryData(
      crmFunnelsQueryOptions(params.companyId),
    );

    return Promise.all([
      context.queryClient.ensureQueryData(leadsQueryOptions(params.companyId)),
      context.queryClient.ensureQueryData(
        crmColumnsQueryOptions(params.companyId, funnels[0].funnelId),
      ),
      context.queryClient.ensureQueryData(
        calendarTasksQueryOptions(
          params.companyId,
          today.getFullYear(),
          today.getMonth(),
        ),
      ),
      context.queryClient.ensureQueryData(
        calendarTasksQueryOptions(params.companyId, nextYear, nextMonth),
      ),
      context.queryClient.ensureQueryData(
        operationalKanbanColumnsQueryOptions(),
      ),
      context.queryClient.ensureQueryData(
        clientTasksQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        personalTasksQueryOptions(params.companyId),
      ),
    ]);
  },
  component: CompanyDashboard,
  ssr: false,
});

function CompanyDashboard() {
  const { companyId } = Route.useParams();
  const { claims, userProfile } = useAuth();
  const { theme } = useTheme();
  const firstName = userProfile?.name.split(' ')[0] ?? '';

  // Boas-vindas é só pra cliente de verdade — admin/owner acessando o
  // dashboard da empresa (preview) nunca deve ver o popup. Guardado só no
  // front (localStorage), sem estado no backend.
  const isClientUser = claims?.accessLevel === 'user';
  const [isFirstTime, markWelcomeSeen] = useIsFirstTime(
    userProfile ? `welcome-seen-${userProfile.uid}` : null,
  );
  const showWelcome = isClientUser && !!userProfile && isFirstTime;

  const [now] = useState(() => Date.now());
  const today = useMemo(() => new Date(now), [now]);
  const { year: nextYear, month: nextMonth } = nextMonthOf(today);

  const { data: leads } = useSuspenseQuery(leadsQueryOptions(companyId));
  const { data: funnels } = useSuspenseQuery(crmFunnelsQueryOptions(companyId));
  const primaryFunnelId = funnels[0].funnelId;
  const { data: crmColumns } = useSuspenseQuery(
    crmColumnsQueryOptions(companyId, primaryFunnelId),
  );
  const { data: thisMonthTasks } = useSuspenseQuery(
    calendarTasksQueryOptions(companyId, today.getFullYear(), today.getMonth()),
  );
  const { data: nextMonthTasks } = useSuspenseQuery(
    calendarTasksQueryOptions(companyId, nextYear, nextMonth),
  );
  const { data: operationalColumns = [] } = useQuery(
    operationalKanbanColumnsQueryOptions(),
  );
  const { data: clientData } = useQuery(clientTasksQueryOptions(companyId));
  const usage = clientData?.usage ?? { used: 0, limit: null, yearMonth: '' };
  const { data: personalTasks } = useSuspenseQuery(
    personalTasksQueryOptions(companyId),
  );

  const tasks = useMemo(
    () => [...thisMonthTasks, ...nextMonthTasks],
    [thisMonthTasks, nextMonthTasks],
  );

  const leadStats = useMemo(() => computeLeadStats(leads, now), [leads, now]);
  const primaryFunnelLeads = useMemo(
    () => leads.filter((lead) => lead.funnelId === primaryFunnelId),
    [leads, primaryFunnelId],
  );
  const funnelStages = useMemo(
    () => computeFunnel(primaryFunnelLeads, crmColumns),
    [primaryFunnelLeads, crmColumns],
  );
  const todayTasks = useMemo(
    () => getTasksOnDay(personalTasks, now),
    [personalTasks, now],
  );
  const upcomingTasks = useMemo(
    () => getUpcomingTasks(tasks, now, 7),
    [tasks, now],
  );
  const dailySeries = useMemo(
    () => computeDailyLeadSeries(leads, now, 7),
    [leads, now],
  );
  const leadsSparkline = useMemo(
    () => computeDailyLeadSeries(leads, now, 14).map((p) => p.leadsNovos),
    [leads, now],
  );
  const weeklyMetrics = useMemo(
    () => computeWeeklyMetrics(leads, tasks, now),
    [leads, tasks, now],
  );

  return (
    <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      {showWelcome && <WelcomeModal onClose={markWelcomeSeen} />}

      {theme === 'dark' && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary-glow/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 right-40 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          />
        </>
      )}

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-black tracking-tight text-text">
            Olá{firstName ? ', ' : ''}
            {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] text-text-sub">
            Bem-vindo ao seu portal. Aqui você acompanha tudo sobre a sua
            empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 animate-fade-in sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<MdOutlinePeopleAlt size={18} />}
            label="Leads novos"
            value={String(leadStats.newLeads.value)}
            trend={leadStats.newLeads.trend}
            sparklineValues={leadsSparkline}
          />
          <StatCard
            icon={<MdOutlineHandshake size={18} />}
            label="Negociações ativas"
            value={String(leadStats.activeDeals.value)}
            trend={leadStats.activeDeals.trend}
          />
          <StatCard
            icon={<MdOutlineTrendingUp size={18} />}
            label="Taxa de conversão"
            value={`${leadStats.conversionRate.value}%`}
            trend={leadStats.conversionRate.trend}
          />
          <TaskQuotaCard used={usage.used} limit={usage.limit} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div
            className="flex animate-fade-in"
            style={{ animationDelay: '60ms' }}
          >
            <SalesFunnel companyId={companyId} stages={funnelStages} />
          </div>
          <div
            className="flex animate-fade-in"
            style={{ animationDelay: '120ms' }}
          >
            <TodayActivitiesCard
              companyId={companyId}
              tasks={todayTasks}
            />
          </div>
          <div
            className="flex animate-fade-in"
            style={{ animationDelay: '180ms' }}
          >
            <UpcomingScheduleCard
              companyId={companyId}
              tasks={upcomingTasks}
              columns={operationalColumns}
            />
          </div>
        </div>

        <div
          className="mt-4 animate-fade-in"
          style={{ animationDelay: '240ms' }}
        >
          <PerformancePanel series={dailySeries} metrics={weeklyMetrics} />
        </div>
      </div>
    </div>
  );
}
