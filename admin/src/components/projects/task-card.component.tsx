import { formatDateShort } from '@/formatters/formatDate';
import type { CompanyResume } from '@/models/company.model';
import type { Task, TaskType } from '@/models/task.model';
import { TASK_TYPE_LABELS } from '@/models/task.model';
import { companyColor, companyInitials } from '@/utils/company-color.util';

const TYPE_DOT: Record<TaskType, string> = {
  feed: 'bg-blue-500',
  stories: 'bg-sky-400',
  reels: 'bg-slate-400',
  carrossel: 'bg-amber-400',
  campanha: 'bg-green-500',
};

interface TaskCardProps {
  task: Task;
  company?: CompanyResume;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function TaskCard({ task, company, onClick, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md active:opacity-80"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[task.type]}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {TASK_TYPE_LABELS[task.type]}
        </span>
      </div>

      <p className="mb-3 text-[13px] font-semibold leading-snug text-text">
        {task.title}
      </p>

      <div className="flex items-center gap-2">
        {company && (
          <>
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white ${companyColor(company.companyId)}`}
            >
              {companyInitials(company.displayName)}
            </div>
            <span className="min-w-0 flex-1 truncate text-[11px] text-text-sub">
              {company.displayName}
            </span>
          </>
        )}
        <span className="shrink-0 text-[11px] text-text-muted">
          {formatDateShort(task.dueDate)}
        </span>
      </div>
    </div>
  );
}
