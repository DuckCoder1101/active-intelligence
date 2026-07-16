import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useRef } from 'react';
import {
  MdAdd,
  MdDeleteOutline,
  MdCheck,
  MdCalendarMonth,
  MdDashboard,
} from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import { AdminCalendarView } from '@/components/workspace/schedule/admin-calendar-view.component';
import { TaskCard } from '@/components/workspace/schedule/task-card.component';
import { TaskModal } from '@/components/workspace/schedule/task-modal.component';
import { useAuth } from '@/contexts/auth.context';
import { useWorkspaceFilter } from '@/hooks/use-workspace-filter.hook';
import { COLUMN_COLOR_PRESETS } from '@/models/operational-kanban.model';
import type { Task } from '@/models/task.model';
import { adminsQueryOptions } from '@/queries/admin.queries';
import { companiesQueryOptions } from '@/queries/company.queries';
import {
  operationalKanbanColumnsQueryOptions,
  useAddOperationalKanbanColumnMutation,
  useRemoveOperationalKanbanColumnMutation,
  useReorderOperationalKanbanColumnsMutation,
} from '@/queries/operational-kanban.queries';
import {
  taskKeys,
  tasksQueryOptions,
  useUpdateTaskStatusMutation,
} from '@/queries/task.queries';

export const Route = createFileRoute('/_admin/workspace/schedule')({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(tasksQueryOptions()),
      context.queryClient.ensureQueryData(
        operationalKanbanColumnsQueryOptions(),
      ),
      context.queryClient.ensureQueryData(companiesQueryOptions()),
      context.queryClient.ensureQueryData(adminsQueryOptions()),
    ]),
  component: WorkspaceSchedule,
});

function WorkspaceSchedule() {
  const { userProfile, claims } = useAuth();
  const { selectedCompanyIds } = useWorkspaceFilter();

  const isOwner = claims?.accessLevel === 'owner';
  const currentUid = userProfile?.uid ?? '';

  const queryClient = useQueryClient();

  const { data: tasks } = useSuspenseQuery(tasksQueryOptions());
  const { data: columns } = useSuspenseQuery(
    operationalKanbanColumnsQueryOptions(),
  );
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { data: admins } = useSuspenseQuery(adminsQueryOptions());

  const updateStatus = useUpdateTaskStatusMutation();
  const reorderColumns = useReorderOperationalKanbanColumnsMutation();
  const addColumn = useAddOperationalKanbanColumnMutation();
  const removeColumn = useRemoveOperationalKanbanColumnMutation();

  // Filters
  const [filterAdmin, setFilterAdmin] = useState('');

  // Task modal
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  // View: kanban or calendar
  const [view, setView] = useState<'kanban' | 'calendario'>('kanban');

  // Card drag and drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Column reorder drag
  const [draggingColId, setDraggingColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Add column form
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState<string>(
    COLUMN_COLOR_PRESETS[0].value,
  );
  const newColInputRef = useRef<HTMLInputElement>(null);

  // Delete column confirm
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.companyId, c])),
    [companies],
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (
        selectedCompanyIds.length > 0 &&
        !selectedCompanyIds.includes(t.companyId)
      ) {
        return false;
      }
      if (filterAdmin) {
        const isAssigned =
          t.assignedTo.length === 0 || t.assignedTo.includes(filterAdmin);
        if (!isAssigned) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedCompanyIds, filterAdmin]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) {
      map[col.columnId] = [];
    }
    for (const t of filtered) {
      if (t.status in map) {
        map[t.status].push(t);
      } else if (columns.length > 0) {
        map[columns[0].columnId].push(t);
      }
    }
    return map;
  }, [columns, filtered]);

  const handleColumnDrop = (targetColId: string) => {
    if (!draggingColId || draggingColId === targetColId) {
      setDraggingColId(null);
      setDragOverColId(null);
      return;
    }
    const from = draggingColId;
    setDraggingColId(null);
    setDragOverColId(null);
    reorderColumns.mutate({ fromId: from, toId: targetColId });
  };

  const handleDrop = (columnId: string) => {
    if (!draggingId) {
      return;
    }
    const task = tasks.find((t) => t.taskId === draggingId);
    if (!task || task.status === columnId) {
      setDraggingId(null);
      setDragOverColumnId(null);
      return;
    }

    const canEdit =
      isOwner ||
      task.assignedTo.length === 0 ||
      task.assignedTo.includes(currentUid);

    if (!canEdit) {
      toast.error('Você não está atribuído a esta tarefa.');
      setDraggingId(null);
      setDragOverColumnId(null);
      return;
    }

    setDraggingId(null);
    setDragOverColumnId(null);
    updateStatus.mutate({ taskId: draggingId, status: columnId });
  };

  const handleSaveColumn = () => {
    if (!newColName.trim()) {
      return;
    }
    addColumn.mutate(
      { name: newColName.trim(), color: newColColor },
      {
        onSuccess: () => {
          setNewColName('');
          setNewColColor(COLUMN_COLOR_PRESETS[0].value);
          setShowAddCol(false);
        },
      },
    );
  };

  const handleDeleteColumn = () => {
    if (!deletingColumnId) {
      return;
    }
    const colName =
      columns.find((c) => c.columnId === deletingColumnId)?.name ?? '';
    removeColumn.mutate(deletingColumnId, {
      onSuccess: ({ movedTo }) => {
        const targetName = columns.find((c) => c.columnId === movedTo)?.name;
        const msg = movedTo
          ? `Quadro "${colName}" excluído. Tarefas movidas para "${targetName}".`
          : `Quadro "${colName}" excluído.`;
        toast.success(msg);
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        setDeletingColumnId(null);
      },
    });
  };

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };
  const openNew = (date?: Date) => {
    setSelectedTask(undefined);
    setNewTaskDate(date);
    setShowModal(true);
  };

  const deletingColumn = columns.find((c) => c.columnId === deletingColumnId);

  const TABS = [
    { id: 'kanban' as const, label: 'Kanban', icon: MdDashboard },
    { id: 'calendario' as const, label: 'Calendário', icon: MdCalendarMonth },
  ];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex w-44 shrink-0 flex-col gap-1 border-r border-border bg-card px-2 py-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
              view === id
                ? 'bg-orange/10 text-orange'
                : 'text-text-sub hover:bg-bg hover:text-text'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {view === 'calendario' && (
        <AdminCalendarView
          tasks={filtered}
          companies={companies}
          columns={columns}
          onTaskClick={openTask}
          onAddTask={openNew}
        />
      )}

      {view === 'kanban' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* Filter: admin */}
              <div className="flex flex-col gap-1">
                <span className="form-label">Responsável</span>
                <select
                  value={filterAdmin}
                  onChange={(e) => setFilterAdmin(e.target.value)}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-orange"
                >
                  <option value="">Todos</option>
                  {admins.map((a) => (
                    <option key={a.uid} value={a.uid}>
                      {a.uid === currentUid ? 'Eu' : a.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => openNew()}
                className="btn-primary shrink-0 px-4"
              >
                <MdAdd size={16} />
                Nova tarefa
              </button>
            </div>
          </div>

          {/* Kanban board */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex h-full gap-4 overflow-x-auto px-6 py-5">
              {columns.map((col) => {
                const colTasks = tasksByColumn[col.columnId] ?? [];
                const isDragOver = dragOverColumnId === col.columnId;

                return (
                  <div
                    key={col.columnId}
                    className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-bg/30 p-2"
                    onDragOver={(e) => {
                      if (draggingColId) {
                        return;
                      }
                      e.preventDefault();
                      setDragOverColumnId(col.columnId);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverColumnId(null);
                      }
                    }}
                    onDrop={() => {
                      if (draggingColId) {
                        return;
                      }
                      handleDrop(col.columnId);
                    }}
                    onDragEnd={() => {
                      setDraggingColId(null);
                      setDragOverColId(null);
                      setDraggingId(null);
                      setDragOverColumnId(null);
                    }}
                  >
                    {/* Column header (draggable for owners) */}
                    <div
                      draggable={isOwner}
                      onDragStart={
                        isOwner
                          ? (e) => {
                              e.stopPropagation();
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggingColId(col.columnId);
                              setDraggingId(null);
                              setDragOverColumnId(null);
                            }
                          : undefined
                      }
                      onDragOver={
                        isOwner
                          ? (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                draggingColId &&
                                draggingColId !== col.columnId
                              ) {
                                setDragOverColId(col.columnId);
                              }
                            }
                          : undefined
                      }
                      onDragLeave={
                        isOwner
                          ? (e) => {
                              if (
                                !e.currentTarget.contains(
                                  e.relatedTarget as Node,
                                )
                              ) {
                                setDragOverColId(null);
                              }
                            }
                          : undefined
                      }
                      onDrop={
                        isOwner
                          ? (e) => {
                              e.stopPropagation();
                              handleColumnDrop(col.columnId);
                            }
                          : undefined
                      }
                      onDragEnd={
                        isOwner
                          ? () => {
                              setDraggingColId(null);
                              setDragOverColId(null);
                            }
                          : undefined
                      }
                      className={`mb-2.5 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                        dragOverColId === col.columnId
                          ? 'border-orange bg-orange/10'
                          : draggingColId === col.columnId
                            ? 'border-border/40 bg-bg/30 opacity-50'
                            : isDragOver
                              ? 'border-orange/40 bg-orange/5'
                              : 'border-border bg-bg/60'
                      } ${isOwner ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      <span className="flex-1 truncate text-[12px] font-bold text-text">
                        {col.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-muted">
                        {colTasks.length}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          title="Excluir quadro"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingColumnId(col.columnId);
                          }}
                          className="shrink-0 text-text-muted/50 transition-colors hover:text-danger"
                        >
                          <MdDeleteOutline size={14} />
                        </button>
                      )}
                    </div>

                    {/* Cards area — scrolls vertically */}
                    <div
                      className={`flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-1 transition-colors ${
                        isDragOver ? 'bg-orange/5 ring-1 ring-orange/20' : ''
                      }`}
                    >
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          company={companyMap[task.companyId]}
                          onClick={() => openTask(task)}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingId(task.taskId);
                          }}
                        />
                      ))}
                      {colTasks.length === 0 && !isDragOver && (
                        <div className="flex min-h-30 items-center justify-center rounded-xl border border-dashed border-border/40">
                          <p className="text-[11px] text-text-muted/50">
                            Sem tarefas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add column (owner only) */}
              {isOwner && (
                <div className="flex w-64 shrink-0 flex-col">
                  {showAddCol ? (
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                      <p className="mb-3 text-[12px] font-bold text-text">
                        Novo quadro
                      </p>
                      <input
                        ref={newColInputRef}
                        type="text"
                        autoFocus
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveColumn();
                          }
                          if (e.key === 'Escape') {
                            setShowAddCol(false);
                            setNewColName('');
                          }
                        }}
                        placeholder="Nome do quadro"
                        className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
                      />
                      {/* Color picker + swatches */}
                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <input
                          type="color"
                          title="Escolher cor"
                          value={newColColor}
                          onChange={(e) => setNewColColor(e.target.value)}
                          className="h-6 w-6 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                        />
                        {COLUMN_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            title={preset.label}
                            onClick={() => setNewColColor(preset.value)}
                            className="relative h-5 w-5 rounded-full transition-transform hover:scale-110"
                            style={{ backgroundColor: preset.value }}
                          >
                            {newColColor === preset.value && (
                              <MdCheck
                                size={12}
                                className="absolute inset-0 m-auto text-white"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCol(false);
                            setNewColName('');
                          }}
                          className="flex-1 rounded-lg border border-border py-1.5 text-[12px] text-text-sub transition-colors hover:bg-bg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveColumn}
                          disabled={!newColName.trim() || addColumn.isPending}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-orange py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          {addColumn.isPending ? <Spinner size={12} /> : null}
                          Criar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCol(true)}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange/50 hover:text-orange"
                    >
                      <MdAdd size={16} />
                      Novo quadro
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          defaultDueDate={newTaskDate}
          companies={companies}
          admins={admins}
          columns={columns}
          isOwner={isOwner}
          currentUid={currentUid}
          onClose={() => setShowModal(false)}
          onSaved={(saved) => {
            queryClient.setQueryData<Task[]>(taskKeys.lists(), (prev) => {
              if (!prev) {
                return prev;
              }
              const exists = prev.some((t) => t.taskId === saved.taskId);
              return exists
                ? prev.map((t) => (t.taskId === saved.taskId ? saved : t))
                : [...prev, saved];
            });
            setShowModal(false);
          }}
          onDeleted={(taskId) => {
            queryClient.setQueryData<Task[]>(taskKeys.lists(), (prev) =>
              prev?.filter((t) => t.taskId !== taskId),
            );
            setShowModal(false);
          }}
        />
      )}

      {/* Confirm delete column */}
      {deletingColumnId && deletingColumn && (
        <ConfirmDeleteModal
          title="Excluir quadro"
          description={`Excluir o quadro "${deletingColumn.name}"? As tarefas serão movidas para o primeiro quadro.`}
          isDeleting={removeColumn.isPending}
          onConfirm={handleDeleteColumn}
          onCancel={() => setDeletingColumnId(null)}
        />
      )}
    </div>
  );
}
