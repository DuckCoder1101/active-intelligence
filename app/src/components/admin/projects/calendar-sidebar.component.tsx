import { useState } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdCalendarMonth,
  MdClose,
} from 'react-icons/md';

import type { Task } from '@/models/task.model';
import { TASK_TYPE_LABELS } from '@/models/task.model';
import type { KanbanColumn } from '@/models/kanban.model';
import type { CompanyResume } from '@/models/company.model';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

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

interface CalendarContentProps {
  tasks: Task[];
  companies: CompanyResume[];
  columns: KanbanColumn[];
  onTaskClick: (task: Task) => void;
}

function CalendarContent({ tasks, companies, columns, onTaskClick }: CalendarContentProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const companyMap = Object.fromEntries(companies.map((c) => [c.companyId, c]));
  const columnMap = Object.fromEntries(columns.map((c) => [c.columnId, c]));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tasksByDay: Record<number, Task[]> = {};
  for (const task of tasks) {
    const d = new Date(task.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(task);
    }
  }

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];

  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Calendar — fixed at top, never reflows */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={prevMonth} className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg hover:text-text">
            <MdChevronLeft size={18} />
          </button>
          <span className="text-[12px] font-bold capitalize text-text">{monthLabel}</span>
          <button type="button" onClick={nextMonth} className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg hover:text-text">
            <MdChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="py-1 text-[10px] font-bold text-text-muted">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            const hasTasks = !!tasksByDay[day];
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center rounded-lg py-1 text-[12px] transition-colors ${
                  isSelected
                    ? 'bg-orange/10 font-bold text-orange'
                    : isToday
                      ? 'font-black text-orange'
                      : 'text-text-sub hover:bg-bg'
                }`}
              >
                <span>{day}</span>
                {hasTasks && (
                  <span className="h-1 w-1 rounded-full bg-orange" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 shrink-0 border-t border-border" />

      {/* Task list — always visible, scrollable */}
      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4 pt-3">
        <p className="mb-2 shrink-0 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {selectedDay === null
            ? 'Selecione um dia'
            : selectedTasks.length === 0
              ? `Dia ${selectedDay} — sem tarefas`
              : `${selectedTasks.length} tarefa${selectedTasks.length > 1 ? 's' : ''} — dia ${selectedDay}`}
        </p>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {selectedTasks.map((task) => {
            const company = companyMap[task.companyId];
            const column = columnMap[task.status];
            return (
              <button
                key={task.taskId}
                type="button"
                onClick={() => onTaskClick(task)}
                className="w-full rounded-lg border border-border bg-bg p-2.5 text-left transition-colors hover:border-orange/40"
              >
                <div className="mb-0.5 flex items-center gap-1.5">
                  {column && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    {TASK_TYPE_LABELS[task.type]}
                  </span>
                </div>
                <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-text">
                  {task.title}
                </p>
                {company && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${companyColor(company.companyId)}`} />
                    <p className="truncate text-[10px] text-text-muted">{company.displayName}</p>
                  </div>
                )}
              </button>
            );
          })}
          {selectedDay === null && (
            <p className="mt-4 text-center text-[11px] text-text-muted/50">
              Clique em um dia com bolinha laranja para ver as tarefas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface CalendarSidebarProps {
  tasks: Task[];
  companies: CompanyResume[];
  columns: KanbanColumn[];
  onTaskClick: (task: Task) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function CalendarSidebar({ tasks, companies, columns, onTaskClick, mobileOpen, onMobileClose }: CalendarSidebarProps) {
  return (
    <>
      {/* Desktop: left panel, always visible */}
      <div className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col border-r border-border bg-card overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <MdCalendarMonth size={14} className="text-orange" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub">
            Calendário
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <CalendarContent
            tasks={tasks}
            companies={companies}
            columns={columns}
            onTaskClick={onTaskClick}
          />
        </div>
      </div>

      {/* Mobile: bottom-sheet modal controlled by parent */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) onMobileClose(); }}
        >
          <div className="flex h-[85vh] w-full flex-col rounded-t-2xl border-t border-border bg-card overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <MdCalendarMonth size={14} className="text-orange" />
                <span className="text-[13px] font-bold text-text">Calendário</span>
              </div>
              <button
                type="button"
                onClick={onMobileClose}
                className="text-text-muted hover:text-text"
              >
                <MdClose size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CalendarContent
                tasks={tasks}
                companies={companies}
                columns={columns}
                onTaskClick={(t) => { onTaskClick(t); onMobileClose(); }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
