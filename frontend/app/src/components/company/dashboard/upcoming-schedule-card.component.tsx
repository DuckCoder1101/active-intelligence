import { Link } from '@tanstack/react-router';

import type { AdminTasksBoardColumn } from '@/models/admin-tasks-board.model';
import type { Task } from '@/models/task.model';

interface UpcomingScheduleCardProps {
  companyId: string;
  tasks: Task[];
  columns: AdminTasksBoardColumn[];
}

const FALLBACK_COLOR = '#94a3b8';

export function UpcomingScheduleCard({
  companyId,
  tasks,
  columns,
}: UpcomingScheduleCardProps) {
  const columnMap = new Map(columns.map((c) => [c.columnId, c]));

  return (
    <div className="dashboard-card flex flex-1 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-text">
          Cronograma – próximos 7 dias
        </h2>
        <Link
          to="/company/$companyId/schedule"
          params={{ companyId }}
          className="text-[11px] font-semibold text-orange hover:opacity-70"
        >
          Ver calendário
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-[12px] text-text-muted">
          Nenhuma tarefa nos próximos dias.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {tasks.map((task) => {
            const column = columnMap.get(task.status);
            const d = new Date(task.dueDate);
            const month = d
              .toLocaleDateString('pt-BR', { month: 'short' })
              .replace('.', '');

            return (
              <li key={task.taskId} className="flex items-center gap-3">
                <div className="flex w-9 shrink-0 flex-col items-center leading-tight">
                  <span className="text-[13px] font-black tabular-nums text-text">
                    {String(d.getDate()).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-text-muted">
                    {month}
                  </span>
                </div>
                <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-text">
                  {task.title}
                </p>
                <span
                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${column?.color ?? FALLBACK_COLOR}26`,
                    color: column?.color ?? FALLBACK_COLOR,
                  }}
                >
                  {column?.name ?? 'Sem status'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
