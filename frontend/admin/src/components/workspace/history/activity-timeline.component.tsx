import { useMemo, useState } from 'react';
import { MdOutlineHistory } from 'react-icons/md';

import { formatDateLong } from '@/formatters/formatDate';
import type { WorkspaceAuditLogModel } from '@/models/audit.model';
import { AUDIT_ACTION_META } from '@/utils/audit-action-meta.util';
import { companyColor, companyInitials } from '@/utils/company-color.util';

const PAGE_SIZE = 50;

interface CompanyResume {
  companyId: string;
  displayName: string;
}

interface ActivityTimelineProps {
  logs: WorkspaceAuditLogModel[];
  companyMap: Record<string, CompanyResume>;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function ActivityTimeline({ logs, companyMap }: ActivityTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const dayGroups = useMemo(() => {
    const groups: { label: string; items: WorkspaceAuditLogModel[] }[] = [];
    let currentKey = '';

    for (const log of logs.slice(0, visibleCount)) {
      const key = dayKey(log.createdAt);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ label: formatDateLong(log.createdAt), items: [] });
      }
      groups[groups.length - 1].items.push(log);
    }

    return groups;
  }, [logs, visibleCount]);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12">
        <MdOutlineHistory size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhuma atividade registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {dayGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {group.label}
          </h3>

          <div className="relative pl-6">
            <div className="absolute left-4.75 top-0 h-full w-px bg-border" />
            <ul className="space-y-1">
              {group.items.map((log) => {
                const meta = AUDIT_ACTION_META[log.action];
                const Icon = meta.icon;
                const company = companyMap[log.companyId];

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
                        {formatTime(log.createdAt)}
                      </p>
                    </div>
                    {company && (
                      <span className="hidden shrink-0 items-center gap-1.5 self-start pt-0.5 sm:flex">
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
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}

      {logs.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="self-center rounded-lg border border-border px-4 py-2 text-[12px] font-medium text-text-sub transition-colors hover:text-text"
        >
          Mostrar mais
        </button>
      )}
    </div>
  );
}
