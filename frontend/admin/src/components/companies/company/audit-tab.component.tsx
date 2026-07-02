import { useQuery } from '@tanstack/react-query';
import {
  MdPersonAdd,
  MdEdit,
  MdPersonRemove,
  MdOutlineHistory,
  MdOutlineAddTask,
  MdOutlineEditNote,
  MdOutlineSwapHoriz,
  MdOutlineDashboard,
} from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import { formatDateLong } from '@/formatters/formatDate';
import type { AuditLogModel, AuditAction } from '@/models/audit.model';
import { auditLogsQueryOptions } from '@/queries/company.queries';

const ACTION_META: Record<
  AuditAction,
  {
    icon: React.ElementType;
    iconClass: string;
    description: (actor: string, target: string | null, log: AuditLogModel) => string;
  }
> = {
  member_added: {
    icon: MdPersonAdd,
    iconClass: 'text-green-500 bg-green-500/10',
    description: (actor, target) =>
      `${actor} adicionou ${target ?? 'um membro'} à empresa`,
  },
  member_updated: {
    icon: MdEdit,
    iconClass: 'text-orange bg-orange/10',
    description: (actor, target) =>
      `${actor} atualizou o perfil de ${target ?? 'um membro'}`,
  },
  member_removed: {
    icon: MdPersonRemove,
    iconClass: 'text-danger bg-danger/10',
    description: (actor, target) =>
      `${actor} removeu ${target ?? 'um membro'} da empresa`,
  },
  task_created: {
    icon: MdOutlineAddTask,
    iconClass: 'text-blue-500 bg-blue-500/10',
    description: (actor, _target, log) =>
      `${actor} criou a tarefa "${log.taskTitle ?? 'sem título'}"`,
  },
  task_updated: {
    icon: MdOutlineEditNote,
    iconClass: 'text-orange bg-orange/10',
    description: (actor, _target, log) =>
      `${actor} editou a tarefa "${log.taskTitle ?? 'sem título'}"`,
  },
  task_status_changed: {
    icon: MdOutlineSwapHoriz,
    iconClass: 'text-purple-500 bg-purple-500/10',
    description: (actor, _target, log) =>
      `${actor} alterou o status de "${log.taskTitle ?? 'sem título'}"`,
  },
  task_column_moved: {
    icon: MdOutlineDashboard,
    iconClass: 'text-sky-500 bg-sky-500/10',
    description: (actor, _target, log) =>
      `${actor} moveu "${log.taskTitle ?? 'sem título'}" no kanban`,
  },
};

type Props = { companyId: string };

export function ClientAuditTab({ companyId }: Props) {
  const { data: logs = [], isLoading } = useQuery(auditLogsQueryOptions(companyId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={20} />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
        <MdOutlineHistory size={28} />
        <p className="text-[13px]">Nenhum registro de auditoria.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-4.75 top-0 h-full w-px bg-border" />
      <ul className="space-y-1">
        {logs.map((log) => {
          const meta = ACTION_META[log.action];
          const Icon = meta.icon;
          return (
            <li key={log.id} className="relative flex gap-4 py-3">
              <div
                className={`absolute -left-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-text">
                  {meta.description(log.actorName, log.targetName, log)}
                </p>
                {log.details && (
                  <p className="mt-0.5 text-[11px] font-medium text-text-sub">
                    {log.details}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {formatDateLong(log.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
