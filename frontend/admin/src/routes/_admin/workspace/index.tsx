import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { MdChevronRight, MdOutlineDashboard } from 'react-icons/md';

import { AttentionWidget } from '@/components/dashboard/attention-widget.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { useAuth } from '@/contexts/auth.context';
import { formatDateShort } from '@/formatters/formatDate';
import { useWorkspaceFilter } from '@/hooks/use-workspace-filter.hook';
import { APPROVED_COLUMN_ID } from '@/models/operational-kanban.model';
import type { Task } from '@/models/task.model';
import { TASK_TYPE_LABELS } from '@/models/task.model';
import { companiesQueryOptions } from '@/queries/company.queries';
import { tasksQueryOptions } from '@/queries/task.queries';
import { companyColor, companyInitials } from '@/utils/company-color.util';
import { getMyAttentionTasks, getStaleCompanies } from '@/utils/dashboard-insights.util';

const DAY_MS = 24 * 60 * 60 * 1000;

export const Route = createFileRoute('/_admin/workspace/')({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(companiesQueryOptions()),
      context.queryClient.ensureQueryData(tasksQueryOptions()),
    ]),
  component: WorkspaceOverview,
});

function WorkspaceOverview() {
  const { userProfile } = useAuth();
  const { selectedCompanyIds, isSingleClient, singleClient } =
    useWorkspaceFilter();
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { data: tasks } = useSuspenseQuery(tasksQueryOptions());

  const [now] = useState(() => Date.now());

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.companyId, c])),
    [companies],
  );

  const scopedCompanies = useMemo(() => {
    if (selectedCompanyIds.length === 0) {
      return companies;
    }
    return companies.filter((c) => selectedCompanyIds.includes(c.companyId));
  }, [companies, selectedCompanyIds]);

  const myTasks = useMemo(
    () =>
      getMyAttentionTasks(tasks, scopedCompanies, userProfile?.uid ?? '', now),
    [tasks, scopedCompanies, userProfile?.uid, now],
  );

  const staleCompanies = useMemo(
    () => getStaleCompanies(scopedCompanies, tasks, 7, now),
    [scopedCompanies, tasks, now],
  );

  const clientTasks = useMemo(
    () =>
      singleClient
        ? tasks.filter((t) => t.companyId === singleClient.companyId)
        : [],
    [tasks, singleClient],
  );

  const clientOpenTasks = useMemo(
    () =>
      clientTasks
        .filter((t) => t.status !== APPROVED_COLUMN_ID)
        .sort((a, b) => a.dueDate - b.dueDate),
    [clientTasks],
  );

  const clientOverdueCount = clientOpenTasks.filter(
    (t) => t.dueDate < now,
  ).length;

  const clientDaysSince = useMemo(() => {
    if (!singleClient) {
      return undefined;
    }
    const activityTimes = clientTasks.map((t) =>
      Math.max(t.createdAt, t.updatedAt),
    );
    const lastActivityAt = Math.max(singleClient.createdAt, ...activityTimes);
    return Math.floor((now - lastActivityAt) / DAY_MS);
  }, [singleClient, clientTasks, now]);

  const heading = isSingleClient
    ? singleClient?.displayName
    : selectedCompanyIds.length > 1
      ? `${selectedCompanyIds.length} clientes selecionados`
      : 'Visão geral';

  const subheading = isSingleClient
    ? 'Visão geral do cliente'
    : selectedCompanyIds.length > 1
      ? 'Painel consolidado dos clientes selecionados'
      : 'Todos os clientes';

  return (
    <AdminPageContainer>
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-2 text-[13px] text-text-sub">{subheading}</p>
      </div>

      {isSingleClient && singleClient ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Última interação"
              value={
                clientDaysSince === undefined
                  ? 'Sem registro'
                  : clientDaysSince <= 0
                    ? 'Hoje'
                    : `há ${clientDaysSince} dia${clientDaysSince === 1 ? '' : 's'}`
              }
            />
            <SummaryCard
              label="Tarefas em aberto"
              value={String(clientOpenTasks.length)}
            />
            <SummaryCard
              label="Tarefas atrasadas"
              value={String(clientOverdueCount)}
              tone={clientOverdueCount > 0 ? 'danger' : undefined}
            />
          </div>

          <TaskListSection
            title="Próximas tarefas"
            tasks={clientOpenTasks.slice(0, 5)}
            companyMap={companyMap}
            emptyLabel="Nenhuma tarefa registrada para este cliente ainda."
          />
        </>
      ) : (
        <>
          <AttentionWidget
            taskCount={myTasks.length}
            staleCompanies={staleCompanies}
          />

          <TaskListSection
            title="Próximas ações"
            tasks={myTasks.map((a) => a.task)}
            companyMap={companyMap}
            emptyLabel="Tudo em dia por aqui."
          />
        </>
      )}
    </AdminPageContainer>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  tone?: 'danger';
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-medium text-text-sub">{label}</p>
      <p
        className={`mt-1 text-[22px] font-black tracking-tight ${
          tone === 'danger' ? 'text-danger' : 'text-text'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface TaskListSectionProps {
  title: string;
  tasks: Task[];
  companyMap: Record<string, { companyId: string; displayName: string }>;
  emptyLabel: string;
}

function TaskListSection({
  title,
  tasks,
  companyMap,
  emptyLabel,
}: TaskListSectionProps) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12">
          <MdOutlineDashboard size={24} className="text-text-muted" />
          <p className="text-[13px] text-text-muted">{emptyLabel}</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {tasks.map((task) => {
            const company = companyMap[task.companyId];
            return (
              <Link
                key={task.taskId}
                to="/workspace/schedule"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg/40"
              >
                <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {TASK_TYPE_LABELS[task.type]}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">
                  {task.title}
                </span>
                {company && (
                  <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black text-white ${companyColor(company.companyId)}`}
                    >
                      {companyInitials(company.displayName)}
                    </span>
                    <span className="text-[11px] text-text-sub">
                      {company.displayName}
                    </span>
                  </span>
                )}
                <span className="shrink-0 text-[11px] text-text-muted">
                  {formatDateShort(task.dueDate)}
                </span>
                <MdChevronRight size={14} className="shrink-0 text-text-muted" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
