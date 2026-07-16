import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { AdminPageContainer } from '@/components/ui/page-container.component';
import { Spinner } from '@/components/ui/spinner.component';
import { ActivityTimeline } from '@/components/workspace/history/activity-timeline.component';
import { DeliveriesList } from '@/components/workspace/history/deliveries-list.component';
import { useWorkspaceFilter } from '@/hooks/use-workspace-filter.hook';
import type { AuditAction } from '@/models/audit.model';
import { APPROVED_COLUMN_ID } from '@/models/operational-kanban.model';
import {
  companiesQueryOptions,
  workspaceAuditLogsQueryOptions,
} from '@/queries/company.queries';
import { tasksQueryOptions } from '@/queries/task.queries';

type HistoryView = 'activity' | 'deliveries';
type ActivityKind = 'all' | 'tasks' | 'members';

const VIEW_OPTIONS: { value: HistoryView; label: string }[] = [
  { value: 'activity', label: 'Atividade' },
  { value: 'deliveries', label: 'Entregas' },
];

const KIND_OPTIONS: { value: ActivityKind; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'members', label: 'Membros' },
];

function matchesKind(action: AuditAction, kind: ActivityKind): boolean {
  if (kind === 'all') {
    return true;
  }
  return kind === 'tasks'
    ? action.startsWith('task_')
    : action.startsWith('member_');
}

export const Route = createFileRoute('/_admin/workspace/history')({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(companiesQueryOptions()),
      context.queryClient.ensureQueryData(tasksQueryOptions()),
    ]),
  component: WorkspaceHistory,
});

function WorkspaceHistory() {
  const { selectedCompanyIds, isSingleClient, singleClient } =
    useWorkspaceFilter();
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { data: tasks } = useSuspenseQuery(tasksQueryOptions());

  const [view, setView] = useState<HistoryView>('activity');
  const [kind, setKind] = useState<ActivityKind>('all');

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery(
    workspaceAuditLogsQueryOptions(selectedCompanyIds),
  );

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.companyId, c])),
    [companies],
  );

  const filteredLogs = useMemo(
    () => logs.filter((log) => matchesKind(log.action, kind)),
    [logs, kind],
  );

  const deliveredTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status === APPROVED_COLUMN_ID &&
            (selectedCompanyIds.length === 0 ||
              selectedCompanyIds.includes(t.companyId)),
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [tasks, selectedCompanyIds],
  );

  const subheading = isSingleClient
    ? `Histórico de ${singleClient?.displayName}`
    : selectedCompanyIds.length > 1
      ? `Histórico de ${selectedCompanyIds.length} clientes selecionados`
      : 'Histórico de todos os clientes';

  return (
    <AdminPageContainer>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
            Histórico
          </h2>
          <p className="mt-2 text-[13px] text-text-sub">{subheading}</p>
        </div>

        <div className="flex rounded-lg border border-border bg-card p-0.5">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                view === option.value
                  ? 'bg-orange/10 text-orange'
                  : 'text-text-sub hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'activity' ? (
        <>
          <div className="mb-5 flex gap-1.5">
            {KIND_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                  kind === option.value
                    ? 'border-orange/40 bg-orange/10 text-orange'
                    : 'border-border text-text-sub hover:text-text'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size={20} />
            </div>
          ) : (
            <ActivityTimeline logs={filteredLogs} companyMap={companyMap} />
          )}
        </>
      ) : (
        <DeliveriesList tasks={deliveredTasks} companyMap={companyMap} />
      )}
    </AdminPageContainer>
  );
}
