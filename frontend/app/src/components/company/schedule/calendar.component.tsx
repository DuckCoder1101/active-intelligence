import { useState } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdAdd,
  MdClose,
  MdOutlinePerson,
  MdOutlineCalendarToday,
  MdOutlineWork,
  MdPersonOutline,
} from 'react-icons/md';

import { PersonalTaskModal } from './personal-task-modal.component';
import { ClientTaskModal } from './task-modal.component';

import { formatDateShort } from '@/formatters/formatDate';
import type { OperationalKanbanColumn } from '@/models/operational-kanban.model';
import type { PersonalTask } from '@/models/personal-task.model';
import type { Task, TaskCategory } from '@/models/task.model';

const FALLBACK_COLUMN_COLOR = '#94a3b8';
const PERSONAL_COLOR = '#8b5cf6';
const PERSONAL_LABEL = 'Pessoal';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
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
const MAX_CHIPS = 2;

type CalendarItem =
  | { kind: 'agency'; task: Task }
  | { kind: 'personal'; task: PersonalTask };

function itemId(item: CalendarItem): string {
  return item.kind === 'agency' ? item.task.taskId : item.task.personalTaskId;
}

function itemDueDate(item: CalendarItem): number {
  return item.task.dueDate;
}

function itemVisual(
  item: CalendarItem,
  columns: OperationalKanbanColumn[],
): { color: string; label: string } {
  if (item.kind === 'personal') {
    return { color: PERSONAL_COLOR, label: PERSONAL_LABEL };
  }
  const column = columns.find((c) => c.columnId === item.task.status);
  return {
    color: column?.color ?? FALLBACK_COLUMN_COLOR,
    label: column?.name ?? 'Sem quadro',
  };
}

interface DayModalProps {
  date: Date;
  items: CalendarItem[];
  columns: OperationalKanbanColumn[];
  categories: TaskCategory[];
  onNewTask: () => void;
  onItemClick: (item: CalendarItem) => void;
  onClose: () => void;
}

function DayModal({
  date,
  items,
  columns,
  categories,
  onNewTask,
  onItemClick,
  onClose,
}: DayModalProps) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const isPast = date < todayStart;

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
        if (e.target === e.currentTarget) {
          onClose();
        }
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
              {items.length === 0
                ? 'Nenhuma tarefa nesse dia'
                : `${items.length} tarefa${items.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNewTask}
              disabled={isPast}
              title={
                isPast
                  ? 'Não é possível criar tarefas em datas passadas'
                  : undefined
              }
              className="flex items-center gap-1.5 rounded-lg bg-orange px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MdAdd size={14} />
              Nova tarefa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text"
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-[13px] text-text-muted">
                Nenhuma tarefa agendada para esse dia.
              </p>
              {!isPast && (
                <button
                  type="button"
                  onClick={onNewTask}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:bg-bg"
                >
                  <MdAdd size={14} />
                  Criar primeira tarefa
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const { color, label } = itemVisual(item, columns);
                const task = item.task;
                return (
                  <button
                    key={itemId(item)}
                    type="button"
                    onClick={() => onItemClick(item)}
                    className="w-full overflow-hidden rounded-xl border border-border bg-bg/60 text-left transition-all hover:-translate-y-px hover:shadow-md"
                  >
                    <div className="flex">
                      <div
                        className="w-1 shrink-0 rounded-l-xl"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 px-3 py-3">
                        {/* Title + status badge */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex-1 text-[13px] font-semibold leading-snug text-text">
                            {task.title}
                          </p>
                          <span
                            className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {label}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[10px] text-text-muted">
                            {item.kind === 'agency' && (
                              <span className="rounded-md bg-card px-1.5 py-0.5 font-semibold">
                                {categories.find((c) => c.categoryId === item.task.categoryId)
                                  ?.name ?? 'Sem categoria'}
                              </span>
                            )}
                            {item.kind === 'agency' && item.task.createdByName && (
                              <span className="flex items-center gap-1 truncate">
                                <MdOutlinePerson size={11} />
                                {item.task.createdByName}
                              </span>
                            )}
                          </div>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] text-text-muted/70">
                            <MdOutlineCalendarToday size={10} />
                            {formatDateShort(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface KindChooserProps {
  onChoose: (kind: 'agency' | 'personal') => void;
  onClose: () => void;
}

function TaskKindChooser({ onChoose, onClose }: KindChooserProps) {
  return (
    <div
      className="modal-overlay bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {onClose();}
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="mb-1 text-[15px] font-bold text-text">Nova tarefa</h2>
        <p className="mb-5 text-[12px] text-text-sub">
          Essa tarefa é um pedido de conteúdo pra agência ou um lembrete só seu?
        </p>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onChoose('agency')}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg/60 p-3.5 text-left transition-colors hover:border-orange"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
              <MdOutlineWork size={18} />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-text">
                Tarefa para Active
              </span>
              <span className="block text-[11px] text-text-muted">
                Vira um pedido de conteúdo pra equipe produzir.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChoose('personal')}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg/60 p-3.5 text-left transition-colors hover:border-violet-500"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-violet-500"
              style={{ backgroundColor: `${PERSONAL_COLOR}1a` }}
            >
              <MdPersonOutline size={18} />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-text">
                Tarefa pessoal
              </span>
              <span className="block text-[11px] text-text-muted">
                Só aparece pra você, não vai pra agência.
              </span>
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-border py-2 text-[12px] font-semibold text-text-sub transition-colors hover:bg-bg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

interface Props {
  companyId: string;
  tasks: Task[];
  personalTasks: PersonalTask[];
  columns: OperationalKanbanColumn[];
  categories: TaskCategory[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
}

type SubModal =
  | 'choose'
  | 'create-agency'
  | 'create-personal'
  | 'view-agency'
  | 'view-personal'
  | null;

export function CompanyScheduleCalendar({
  companyId,
  tasks,
  personalTasks,
  columns,
  categories,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onTaskCreated,
  onTaskUpdated,
}: Props) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [subModal, setSubModal] = useState<SubModal>(null);
  const [viewingItem, setViewingItem] = useState<CalendarItem | undefined>(
    undefined,
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const items: CalendarItem[] = [
    ...tasks.map((task): CalendarItem => ({ kind: 'agency', task })),
    ...personalTasks.map((task): CalendarItem => ({ kind: 'personal', task })),
  ];

  const itemsByDay: Partial<Record<number, CalendarItem[]>> = {};
  for (const item of items) {
    const day = new Date(itemDueDate(item)).getDate();
    const arr = itemsByDay[day] ?? [];
    arr.push(item);
    itemsByDay[day] = arr;
  }

  const selectedDate =
    selectedDay !== null ? new Date(year, month, selectedDay) : null;
  const selectedItems =
    selectedDay !== null ? (itemsByDay[selectedDay] ?? []) : [];

  const handlePrev = () => {
    setSelectedDay(null);
    onPrevMonth();
  };
  const handleNext = () => {
    setSelectedDay(null);
    onNextMonth();
  };

  const openCreateChooser = () => setSubModal('choose');
  const openView = (item: CalendarItem) => {
    setViewingItem(item);
    setSubModal(item.kind === 'agency' ? 'view-agency' : 'view-personal');
  };
  const closeSubModal = () => {
    setSubModal(null);
    setViewingItem(undefined);
  };
  const closeDayModal = () => {
    setSelectedDay(null);
    closeSubModal();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header: month nav + legend */}
      <div className="shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            <MdChevronLeft size={20} />
          </button>
          <h2 className="min-w-40 text-center text-[15px] font-bold capitalize text-text">
            {MONTHS[month]} {year}
          </h2>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="shrink-0 grid grid-cols-7 border-b border-border bg-bg/50">
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
              className={`min-h-28 border-b border-border bg-bg/20 ${i < 6 ? 'border-r' : ''}`}
            />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            const isPastDay = new Date(year, month, day) < todayStart;
            const dayItems = itemsByDay[day] ?? [];
            const visible = dayItems.slice(0, MAX_CHIPS);
            const overflow = dayItems.length - MAX_CHIPS;
            const colIndex = (firstDay + day - 1) % 7;
            const isLastCol = colIndex === 6;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`group min-h-28 cursor-pointer border-b border-border p-1.5 transition-colors ${isPastDay ? 'bg-bg/20' : 'hover:bg-bg/60'} ${isLastCol ? '' : 'border-r'}`}
              >
                {/* Day number */}
                <div className="mb-1 flex justify-end pr-0.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                      isToday
                        ? 'bg-orange text-white'
                        : isPastDay
                          ? 'text-text-muted/70'
                          : 'text-text-sub group-hover:bg-border'
                    }`}
                  >
                    {day}
                  </span>
                </div>

                {/* Task chips */}
                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const { color } = itemVisual(item, columns);

                    return (
                      <div
                        key={itemId(item)}
                        className="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: color }}
                        title={item.task.title}
                      >
                        {item.task.title}
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
        {columns.map((col) => (
          <div key={col.columnId} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: col.color }}
            />
            <span className="text-[11px] text-text-muted">{col.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: PERSONAL_COLOR }}
          />
          <span className="text-[11px] text-text-muted">{PERSONAL_LABEL}</span>
        </div>
      </div>

      {/* Day modal */}
      {selectedDay !== null && selectedDate !== null && subModal === null && (
        <DayModal
          date={selectedDate}
          items={selectedItems}
          columns={columns}
          categories={categories}
          onNewTask={openCreateChooser}
          onItemClick={openView}
          onClose={closeDayModal}
        />
      )}

      {/* Kind chooser */}
      {subModal === 'choose' && (
        <TaskKindChooser
          onChoose={(kind) =>
            setSubModal(kind === 'agency' ? 'create-agency' : 'create-personal')
          }
          onClose={closeSubModal}
        />
      )}

      {/* Create agency task modal */}
      {subModal === 'create-agency' && (
        <ClientTaskModal
          companyId={companyId}
          defaultDate={selectedDate ?? undefined}
          columns={columns}
          onClose={closeSubModal}
          onCreated={(task) => {
            onTaskCreated(task);
            closeSubModal();
          }}
        />
      )}

      {/* Create personal task modal */}
      {subModal === 'create-personal' && (
        <PersonalTaskModal
          companyId={companyId}
          defaultDate={selectedDate ?? undefined}
          onClose={closeSubModal}
          onSaved={closeSubModal}
          onDeleted={closeSubModal}
        />
      )}

      {subModal === 'view-agency' &&
        viewingItem?.kind === 'agency' && (
          <ClientTaskModal
            companyId={companyId}
            task={viewingItem.task}
            columns={columns}
            onClose={closeSubModal}
            onCreated={onTaskCreated}
            onApproved={(task) => {
              onTaskUpdated(task);
              closeSubModal();
            }}
          />
        )}

      {subModal === 'view-personal' &&
        viewingItem?.kind === 'personal' && (
          <PersonalTaskModal
            companyId={companyId}
            personalTask={viewingItem.task}
            onClose={closeSubModal}
            onSaved={closeSubModal}
            onDeleted={closeSubModal}
          />
        )}
    </div>
  );
}
