import { Link } from '@tanstack/react-router';

import type { PersonalTask } from '@/models/personal-task.model';

interface TodayActivitiesCardProps {
  companyId: string;
  tasks: PersonalTask[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TodayActivitiesCard({
  companyId,
  tasks,
}: TodayActivitiesCardProps) {
  return (
    <div className="dashboard-card flex flex-1 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-text">Atividades do dia</h2>
        <Link
          to="/company/$companyId/schedule"
          params={{ companyId }}
          className="text-[11px] font-semibold text-orange hover:opacity-70"
        >
          Ver tarefas
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-[12px] text-text-muted">
          Nenhuma tarefa para hoje.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {tasks.map((task) => (
            <li key={task.personalTaskId} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: task.color }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-text">
                  {task.title}
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  {task.description || 'Tarefa pessoal'}
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-sub">
                {formatTime(task.dueDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
