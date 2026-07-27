import { Link } from '@tanstack/react-router';
import type { ElementType } from 'react';
import {
  MdCampaign,
  MdOutlineImage,
  MdOutlineSlideshow,
  MdOutlineViewCarousel,
} from 'react-icons/md';

import { TASK_TYPE_LABELS } from '@/models/task.model';
import type { Task, TaskType } from '@/models/task.model';

interface TodayActivitiesCardProps {
  companyId: string;
  tasks: Task[];
}

const TYPE_ICONS: Record<TaskType, ElementType> = {
  feed: MdOutlineImage,
  stories: MdOutlineSlideshow,
  reels: MdOutlineSlideshow,
  carrossel: MdOutlineViewCarousel,
  campanha: MdCampaign,
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TodayActivitiesCard({ companyId, tasks }: TodayActivitiesCardProps) {
  return (
    <div className="card flex flex-1 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-text">Atividades do dia</h2>
        <Link
          to="/company/$companyId/schedule"
          params={{ companyId }}
          className="text-[11px] font-semibold text-orange hover:opacity-70"
        >
          Ver todas
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-[12px] text-text-muted">
          Nenhuma tarefa para hoje.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {tasks.map((task) => {
            const Icon = TYPE_ICONS[task.type];
            return (
              <li key={task.taskId} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg text-text-sub">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-text">
                    {task.title}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">
                    {task.description || TASK_TYPE_LABELS[task.type]}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-text-sub">
                  {formatTime(task.dueDate)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
