import { useMemo } from 'react';
import { MdOutlineInventory2 } from 'react-icons/md';

import { formatDateShort } from '@/formatters/formatDate';
import type { Task } from '@/models/task.model';
import { TASK_TYPE_LABELS } from '@/models/task.model';
import { companyColor, companyInitials } from '@/utils/company-color.util';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface CompanyResume {
  companyId: string;
  displayName: string;
}

interface DeliveriesListProps {
  tasks: Task[];
  companyMap: Record<string, CompanyResume>;
}

function monthLabel(ts: number): string {
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function DeliveriesList({ tasks, companyMap }: DeliveriesListProps) {
  const monthGroups = useMemo(() => {
    const groups: { label: string; items: Task[] }[] = [];
    let currentLabel = '';

    for (const task of tasks) {
      const label = monthLabel(task.updatedAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(task);
    }

    return groups;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12">
        <MdOutlineInventory2 size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhuma entrega concluída ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {monthGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {group.label}
            <span className="font-medium normal-case">
              {group.items.length} entrega{group.items.length === 1 ? '' : 's'}
            </span>
          </h3>

          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {group.items.map((task) => {
              const company = companyMap[task.companyId];
              return (
                <div
                  key={task.taskId}
                  className="flex items-center gap-3 px-4 py-3"
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
                    {formatDateShort(task.updatedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
