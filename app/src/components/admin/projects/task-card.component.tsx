import type { Task, TaskType } from '@/models/task.model';
import { TASK_TYPE_LABELS } from '@/models/task.model';
import type { CompanyResume } from '@/models/company.model';

const TYPE_DOT: Record<TaskType, string> = {
  feed: 'bg-blue-500',
  stories: 'bg-sky-400',
  reels: 'bg-slate-400',
  carrossel: 'bg-amber-400',
  campanha: 'bg-green-500',
};

const COMPANY_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-violet-600',
  'bg-rose-500',
  'bg-teal-600',
  'bg-orange-500',
  'bg-indigo-600',
];

function companyColor(id: string): string {
  let h = 0;
  for (const c of id) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return COMPANY_COLORS[Math.abs(h) % COMPANY_COLORS.length];
}

function companyInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDueDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
          {formatDueDate(task.dueDate)}
        </span>
      </div>
    </div>
  );
}
