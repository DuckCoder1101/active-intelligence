import { useState, useMemo, useRef } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { MdAdd, MdDeleteOutline, MdCheck, MdCalendarMonth } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import { TaskCard } from '@/components/admin/projects/task-card.component';
import { TaskModal } from '@/components/admin/projects/task-modal.component';
import { CalendarSidebar } from '@/components/admin/projects/calendar-sidebar.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';

import { useTasks } from '@/hooks/useTasks';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { useCompanies } from '@/hooks/useCompanies';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/auth.context';
import { useSnackbar } from '@/contexts/snackbar.context';
import { useHandleError } from '@/hooks/useHandleError.util';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

import type { RouteAccessLevel } from '@/types/route-access.type';
import type { Task } from '@/models/task.model';
import { COLUMN_COLOR_PRESETS } from '@/models/kanban.model';

const ACCESS: RouteAccessLevel = { minAccessLevel: 'admin' };

export const Route = createFileRoute('/app/admin/projects/')({
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ACCESS)) {
      throw redirect({ to: '/app/unauthorized' });
    }
  },
  component: ProjectsKanbanPage,
});

function ProjectsKanbanPage() {
  const { profile, claims } = useAuth();
  const isOwner = claims?.accessLevel === 'owner';
  const currentUid = profile?.uid ?? '';
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const { tasks, isLoading: tasksLoading, updateStatus, upsertTask, removeTask, refresh: refreshTasks } = useTasks();
  const { columns, isLoading: columnsLoading, addColumn, removeColumn, reorderColumns } = useKanbanColumns();
  const { companies } = useCompanies();
  const { users } = useUsers();

  const admins = useMemo(
    () => users.filter((u) => u.accessLevel === 'admin' || u.accessLevel === 'owner'),
    [users],
  );

  const isLoading = tasksLoading || columnsLoading;

  // Filters
  const [filterCompany, setFilterCompany] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');

  // Task modal
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  // Mobile calendar
  const [showCalendarMobile, setShowCalendarMobile] = useState(false);

  // Card drag and drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Column reorder drag
  const [draggingColId, setDraggingColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Add column form
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState<string>(COLUMN_COLOR_PRESETS[0].value);
  const [savingCol, setSavingCol] = useState(false);
  const newColInputRef = useRef<HTMLInputElement>(null);

  // Delete column confirm
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.companyId, c])),
    [companies],
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterCompany && t.companyId !== filterCompany) return false;
      if (filterAdmin) {
        const isAssigned =
          t.assignedTo.length === 0 || t.assignedTo.includes(filterAdmin);
        if (!isAssigned) return false;
      }
      return true;
    });
  }, [tasks, filterCompany, filterAdmin]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) map[col.columnId] = [];
    for (const t of filtered) {
      if (map[t.status] !== undefined) {
        map[t.status].push(t);
      } else {
        // Task belongs to a deleted column — show in first column
        const first = columns[0];
        if (first) {
          if (!map[first.columnId]) map[first.columnId] = [];
          map[first.columnId].push(t);
        }
      }
    }
    return map;
  }, [filtered, columns]);

  const handleColumnDrop = async (targetColId: string) => {
    if (!draggingColId || draggingColId === targetColId) {
      setDraggingColId(null);
      setDragOverColId(null);
      return;
    }
    const from = draggingColId;
    setDraggingColId(null);
    setDragOverColId(null);
    try {
      await reorderColumns(from, targetColId);
    } catch (err) {
      handleError(err);
    }
  };

  const handleDrop = async (columnId: string) => {
    if (!draggingId) return;
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
      pushSnackbar({ type: 'error', message: 'Você não está atribuído a esta tarefa.' });
      setDraggingId(null);
      setDragOverColumnId(null);
      return;
    }

    setDraggingId(null);
    setDragOverColumnId(null);
    await updateStatus(draggingId, columnId);
  };

  const handleSaveColumn = async () => {
    if (!newColName.trim()) return;
    setSavingCol(true);
    try {
      await addColumn({ name: newColName.trim(), color: newColColor });
      setNewColName('');
      setNewColColor(COLUMN_COLOR_PRESETS[0].value);
      setShowAddCol(false);
    } catch (err) {
      handleError(err);
    } finally {
      setSavingCol(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!deletingColumnId) return;
    setIsDeletingColumn(true);
    try {
      const colName = columns.find((c) => c.columnId === deletingColumnId)?.name ?? '';
      await removeColumn(deletingColumnId, (movedTo) => {
        const targetName = columns.find((c) => c.columnId === movedTo)?.name;
        const msg = movedTo
          ? `Quadro "${colName}" excluído. Tarefas movidas para "${targetName}".`
          : `Quadro "${colName}" excluído.`;
        pushSnackbar({ type: 'success', message: msg });
        refreshTasks();
      });
      setDeletingColumnId(null);
    } catch (err) {
      handleError(err);
    } finally {
      setIsDeletingColumn(false);
    }
  };

  const openTask = (task: Task) => { setSelectedTask(task); setShowModal(true); };
  const openNew = () => { setSelectedTask(undefined); setShowModal(true); };

  const deletingColumn = columns.find((c) => c.columnId === deletingColumnId);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Calendar Panel (LEFT, always open on desktop) */}
      <CalendarSidebar
        tasks={filtered}
        companies={companies}
        columns={columns}
        onTaskClick={openTask}
        mobileOpen={showCalendarMobile}
        onMobileClose={() => setShowCalendarMobile(false)}
      />

      {/* Main kanban area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-text">
              Kanban de tarefas
            </h1>
            <p className="mt-0.5 text-[12px] text-text-muted">
              Arraste cards entre colunas. Owners podem criar e excluir quadros.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Filter: company */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
                Cliente
              </span>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-orange"
              >
                <option value="">Todos</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: admin */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
                Responsável
              </span>
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
              type="button"
              onClick={() => setShowCalendarMobile(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 py-2 text-[13px] font-semibold text-text-sub transition-colors hover:bg-bg lg:hidden"
            >
              <MdCalendarMonth size={16} />
              Calendário
            </button>

            <button
              onClick={openNew}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
            >
              <MdAdd size={16} />
              Nova tarefa
            </button>
          </div>
        </div>

        {/* Kanban board */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={28} className="text-orange" />
          </div>
        ) : (
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
                      if (draggingColId) return;
                      e.preventDefault();
                      setDragOverColumnId(col.columnId);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverColumnId(null);
                      }
                    }}
                    onDrop={() => {
                      if (draggingColId) return;
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
                      onDragStart={isOwner ? (e) => {
                        e.stopPropagation();
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingColId(col.columnId);
                        setDraggingId(null);
                        setDragOverColumnId(null);
                      } : undefined}
                      onDragOver={isOwner ? (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggingColId && draggingColId !== col.columnId) {
                          setDragOverColId(col.columnId);
                        }
                      } : undefined}
                      onDragLeave={isOwner ? (e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverColId(null);
                        }
                      } : undefined}
                      onDrop={isOwner ? (e) => {
                        e.stopPropagation();
                        handleColumnDrop(col.columnId);
                      } : undefined}
                      onDragEnd={isOwner ? () => { setDraggingColId(null); setDragOverColId(null); } : undefined}
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
                          onClick={(e) => { e.stopPropagation(); setDeletingColumnId(col.columnId); }}
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
                          <p className="text-[11px] text-text-muted/50">Sem tarefas</p>
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
                      <p className="mb-3 text-[12px] font-bold text-text">Novo quadro</p>
                      <input
                        ref={newColInputRef}
                        type="text"
                        autoFocus
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveColumn();
                          if (e.key === 'Escape') { setShowAddCol(false); setNewColName(''); }
                        }}
                        placeholder="Nome do quadro"
                        className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
                      />
                      {/* Color swatches */}
                      <div className="mb-3 flex flex-wrap gap-1.5">
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
                              <MdCheck size={12} className="absolute inset-0 m-auto text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowAddCol(false); setNewColName(''); }}
                          className="flex-1 rounded-lg border border-border py-1.5 text-[12px] text-text-sub transition-colors hover:bg-bg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveColumn}
                          disabled={!newColName.trim() || savingCol}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-orange py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          {savingCol ? <Spinner size={12} /> : null}
                          Criar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setShowAddCol(true); setTimeout(() => newColInputRef.current?.focus(), 50); }}
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
        )}
      </div>

      {/* Task modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          companies={companies}
          admins={admins}
          columns={columns}
          isOwner={isOwner}
          currentUid={currentUid}
          onClose={() => setShowModal(false)}
          onSaved={(saved) => { upsertTask(saved); setShowModal(false); }}
          onDeleted={(taskId) => { removeTask(taskId); setShowModal(false); }}
        />
      )}

      {/* Confirm delete column */}
      {deletingColumnId && deletingColumn && (
        <ConfirmDeleteModal
          title="Excluir quadro"
          description={`Excluir o quadro "${deletingColumn.name}"? As tarefas serão movidas para o primeiro quadro.`}
          isDeleting={isDeletingColumn}
          onConfirm={handleDeleteColumn}
          onCancel={() => setDeletingColumnId(null)}
        />
      )}
    </div>
  );
}
