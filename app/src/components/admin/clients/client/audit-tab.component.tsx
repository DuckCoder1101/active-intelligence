import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MdPersonAdd,
  MdEdit,
  MdPersonRemove,
  MdOutlineHistory,
} from 'react-icons/md';

import CompanyService from '@/services/company.service';
import { Spinner } from '@/components/ui/spinner.component';
import { useHandleError } from '@/hooks/useHandleError.util';

import type { AuditLogModel, AuditAction } from '@/models/audit.model';

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_META: Record<
  AuditAction,
  {
    icon: React.ElementType;
    iconClass: string;
    description: (actor: string, target: string | null) => string;
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
      `${actor} atualizou o cargo de ${target ?? 'um membro'}`,
  },
  member_removed: {
    icon: MdPersonRemove,
    iconClass: 'text-danger bg-danger/10',
    description: (actor, target) =>
      `${actor} removeu ${target ?? 'um membro'} da empresa`,
  },
};

type Props = { companyId: string };

export function ClientAuditTab({ companyId }: Props) {
  const [logs, setLogs] = useState<AuditLogModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const handleError = useHandleError();

  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    CompanyService.listAuditLogs(companyId)
      .then(setLogs)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

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
                  {meta.description(log.actorName, log.targetName)}
                </p>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
