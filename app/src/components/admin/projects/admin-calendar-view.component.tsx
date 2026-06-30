import { useState, useMemo, useRef } from 'react';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';

import type { Task, TaskStatus } from '@/models/task.model';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_LABELS,
} from '@/models/task.model';
import type { CompanyResume } from '@/models/company.model';
import TaskService from '@/services/task.service';
import { useSnackbar } from '@/contexts/snackbar.context';
import { useHandleError } from '@/hooks/useHandleError.util';
import { Spinner } from '@/components/ui/spinner.component';

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
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MAX_CHIPS = 2;
const APPROVAL_STATUSES: TaskStatus[] = [
  'pending_approval',
  'approved',
  'in_progress',
  'completed',
  'rejected',
];

// ─── Day Tasks Modal ─────────────────────────────────────────────────────────

interface DayTasksModalProps {
  date: Date;
  tasks: Task[];
  companies: CompanyResume[];
  localStatuses: Record<string, TaskStatus>;
  updatingId: string | null;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onClose: () => void;
}

function DayTasksModal({
  date,
  tasks,
  companies,
  localStatuses,
  updatingId,
  onStatusChange,
  onTaskClick,
  onClose,
}: DayTasksModalProps) {
  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.companyId, c])),
    [companies],
  );

  const dateLabel = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[14px] font-bold capitalize text-text">
              {dateLabel}
            </h2>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {tasks.length === 0
                ? 'Nenhuma tarefa nesse dia'
                : `${tasks.length} tarefa${tasks.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Task list */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {tasks.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-text-muted">
              Nenhuma tarefa agendada para esse dia.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const currentStatus = (localStatuses[task.taskId] ??
                  task.approvalStatus) as TaskStatus | undefined;
                const isUpdating = updatingId === task.taskId;
                const company = companyMap[task.companyId];

                return (
                  <div
                    key={task.taskId}
                    className="rounded-xl border border-border bg-bg/60 p-3"
                  >
                    {/* Title row */}
                    <button
                      type="button"
                      onClick={() => onTaskClick(task)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        {currentStatus && (
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${TASK_STATUS_COLORS[currentStatus]}`}
                          />
                        )}
                        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">
                          {task.title}
                        </p>
                        <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-muted">
                          {TASK_TYPE_LABELS[task.type]}
                        </span>
                      </div>
                      <p className="mt-0.5 pl-4 text-[11px] text-text-muted">
                        {company.displayName}
                      </p>
                    </button>

                    {/* Status select */}
                    <div className="relative mt-2.5">
                      <select
                        value={currentStatus ?? ''}
                        disabled={isUpdating}
                        onChange={(e) =>
                          onStatusChange(task, e.target.value as TaskStatus)
                        }
                        className="w-full appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-7 text-[11px] font-medium text-text outline-none transition-colors focus:border-orange disabled:opacity-50"
                      >
                        {!currentStatus && (
                          <option value="">— sem status —</option>
                        )}
                        {APPROVAL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {TASK_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      {isUpdating && (
                        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                          <Spinner size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Full Calendar View ───────────────────────────────────────────────────────

interface AdminCalendarViewProps {
  tasks: Task[];
  companies: CompanyResume[];
  onTaskClick: (task: Task) => void;
}

export function AdminCalendarView({
  tasks,
  companies,
  onTaskClick,
}: AdminCalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [localStatuses, setLocalStatuses] = useState<
    Record<string, TaskStatus>
  >({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { pushSnackbar } = useSnackbar();
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const goToday = () => {
    setSelectedDay(null);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tasksByDay = useMemo(() => {
    const map: Partial<Record<number, Task[]>> = {};
    for (const task of tasks) {
      const d = new Date(task.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const arr = map[day] ?? [];
        arr.push(task);
        map[day] = arr;
      }
    }
    return map;
  }, [tasks, year, month]);

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [task.taskId]: newStatus }));
    setUpdatingId(task.taskId);
    try {
      await TaskService.updateClientTaskStatus(task.taskId, newStatus);
      pushSnackbar({
        type: 'success',
        message: `Status: ${TASK_STATUS_LABELS[newStatus]}`,
      });
    } catch (err) {
      setLocalStatuses((prev) => {
        const next = { ...prev };
        delete next[task.taskId];
        return next;
      });
      handleErrorRef.current(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedDate =
    selectedDay !== null ? new Date(year, month, selectedDay) : null;
  const selectedTasks =
    selectedDay !== null ? (tasksByDay[selectedDay] ?? []) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      {/* Calendar header */}
      <div className="flex shrink-0 items-center gap-3 border border-border px-6 py-3 justify-center">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg hover:text-text"
        >
          <MdChevronLeft size={20} />
        </button>
        <h2 className="min-w-40 text-center text-[15px] font-bold capitalize text-text">
          {MONTHS[month]} {year}
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg hover:text-text"
        >
          <MdChevronRight size={20} />
        </button>
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg border border-border px-3 py-1 text-[12px] font-semibold text-text-sub transition-colors hover:bg-bg"
        >
          Hoje
        </button>
      </div>

      {/* Weekday headers */}
      <div className="shrink-0 grid grid-cols-7 border border-t-0 border-border bg-bg/50">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div
              key={`e${i}`}
              className={`min-h-28 border border-border bg-bg/20 ${i < 6 ? 'border-r' : ''}`}
            />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            const dayTasks = tasksByDay[day] ?? [];
            const visible = dayTasks.slice(0, MAX_CHIPS);
            const overflow = dayTasks.length - MAX_CHIPS;
            const colIndex = (firstDay + day - 1) % 7;
            const isLastCol = colIndex === 6;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`group min-h-28 cursor-pointer border-b border-border p-1.5 transition-colors hover:bg-bg/60 ${isLastCol ? '' : 'border-r'}`}
              >
                {/* Day number */}
                <div className="mb-1 flex justify-end pr-0.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                      isToday
                        ? 'bg-orange text-white'
                        : 'text-text-sub group-hover:bg-border'
                    }`}
                  >
                    {day}
                  </span>
                </div>

                {/* Task chips */}
                <div className="space-y-0.5">
                  {visible.map((task) => {
                    const status = (localStatuses[task.taskId] ??
                      task.approvalStatus) as TaskStatus | undefined;
                    return (
                      <div
                        key={task.taskId}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${
                          status
                            ? TASK_STATUS_COLORS[status]
                            : 'bg-border text-text-muted'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {overflow > 0 && (
                    <div className="pl-1 text-[10px] font-medium text-text-muted">
                      +{overflow} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="shrink-0 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-6 py-2.5">
        {(
          [
            'pending_approval',
            'in_progress',
            'completed',
            'rejected',
          ] as TaskStatus[]
        ).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${TASK_STATUS_COLORS[s]}`} />
            <span className="text-[11px] text-text-muted">
              {TASK_STATUS_LABELS[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Day tasks modal */}
      {selectedDate !== null && (
        <DayTasksModal
          date={selectedDate}
          tasks={selectedTasks}
          companies={companies}
          localStatuses={localStatuses}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
          onTaskClick={(task) => {
            setSelectedDay(null);
            onTaskClick(task);
          }}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
