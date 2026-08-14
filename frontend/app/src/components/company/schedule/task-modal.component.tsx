import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MdClose, MdOutlineCalendarToday } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ReferenceImages } from '@/components/tasks/reference-images.component';
import { ReferenceLinks } from '@/components/tasks/reference-links.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';
import { formatDateLong } from '@/formatters/formatDate';
import type { AdminTasksBoardColumn } from '@/models/admin-tasks-board.model';
import { PENDING_APPROVAL_COLUMN_ID, APPROVED_COLUMN_ID } from '@/models/admin-tasks-board.model';
import type { Task, CreateClientTaskDTO } from '@/models/task.model';
import { taskCategoriesQueryOptions } from '@/queries/task-category.queries';
import {
  useApproveClientTaskMutation,
  useCreateClientTaskMutation,
} from '@/queries/task.queries';

const FALLBACK_COLUMN_COLOR = '#94a3b8';

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  companyId: string;
  task?: Task;
  columns: AdminTasksBoardColumn[];
  defaultDate?: Date;
  onClose: () => void;
  onCreated: (task: Task) => void;
  onApproved?: (task: Task) => void;
}

export function ClientTaskModal({
  companyId,
  task,
  columns,
  defaultDate,
  onClose,
  onCreated,
  onApproved,
}: Props) {
  const isView = !!task;
  const { userProfile: profile } = useAuth();
  const authorName = profile?.name ?? '';

  const createTask = useCreateClientTaskMutation();
  const approveTask = useApproveClientTaskMutation();
  const { data: categories = [] } = useQuery(taskCategoriesQueryOptions());

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? (categories[0]?.categoryId ?? ''));
  const [subcategoryId, setSubcategoryId] = useState(task?.subcategoryId ?? '');
  const [dueDateStr, setDueDateStr] = useState(
    defaultDate ? toInputDate(defaultDate) : '',
  );
  const [links, setLinks] = useState<string[]>(task?.referenceLinks ?? []);
  const [images, setImages] = useState<string[]>(task?.referenceImages ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {errs.title = 'Título obrigatório';}
    if (!dueDateStr) {errs.dueDate = 'Data de entrega obrigatória';}
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {return;}

    const [year, month, day] = dueDateStr.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day, 12).getTime();

    const dto: CreateClientTaskDTO = {
      title: title.trim(),
      description: description || undefined,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      dueDate,
      referenceLinks: links.length > 0 ? links : undefined,
      createdByName: authorName || undefined,
    };

    createTask.mutate(
      { dto, companyId, pendingFiles },
      {
        onSuccess: (finalTask) => {
          onCreated(finalTask);
          toast.success('Tarefa enviada para aprovação!');
          onClose();
        },
      },
    );
  };

  const handleApprove = () => {
    if (!task) {return;}

    approveTask.mutate(
      { taskId: task.taskId, actorName: authorName || undefined },
      {
        onSuccess: () => {
          toast.success('Tarefa aprovada!');
          onApproved?.({ ...task, status: APPROVED_COLUMN_ID });
          onClose();
        },
      },
    );
  };

  const currentColumn = columns.find((c) => c.columnId === task?.status);
  const canApprove = isView && task?.status === PENDING_APPROVAL_COLUMN_ID;
  const selectedCategory = categories.find((c) => c.categoryId === categoryId);
  const taskCategory = categories.find((c) => c.categoryId === task?.categoryId);
  const taskSubcategory = taskCategory?.subcategories.find(
    (s) => s.subcategoryId === task?.subcategoryId,
  );

  return (
    <div
      className="modal-overlay bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {onClose();}
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-text">
              {isView ? 'Detalhes da tarefa' : 'Nova tarefa'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {isView ? (
            /* ─── View mode ─── */
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="form-label mb-1">Título</p>
                  <p className="text-[14px] font-semibold text-text">
                    {task.title}
                  </p>
                </div>

                {task.description && (
                  <div>
                    <p className="form-label mb-1">Descrição</p>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-sub">
                      {task.description}
                    </p>
                  </div>
                )}

                <div>
                  <p className="form-label mb-1">Categoria</p>
                  <p className="text-[13px] text-text-sub">
                    {taskCategory?.name ?? 'Sem categoria'}
                    {taskSubcategory ? ` · ${taskSubcategory.name}` : ''}
                  </p>
                </div>

                <div>
                  <p className="form-label mb-1">Status</p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                    style={{
                      backgroundColor:
                        currentColumn?.color ?? FALLBACK_COLUMN_COLOR,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                    {currentColumn?.name ?? 'Sem quadro'}
                  </span>
                </div>

                <div>
                  <p className="form-label mb-1">Data de entrega</p>
                  <div className="flex items-center gap-1.5 text-[13px] text-text-sub">
                    <MdOutlineCalendarToday size={13} />
                    {formatDateLong(task.dueDate)}
                  </div>
                </div>

                <div>
                  <p className="form-label mb-1">Solicitado por</p>
                  <p className="text-[13px] text-text-sub">
                    {task.createdByName ?? 'Não informado'}
                  </p>
                </div>
              </div>

              <ReferenceLinks links={task.referenceLinks} readonly />
              <ReferenceImages images={task.referenceImages} readonly />
            </>
          ) : (
            /* ─── Create mode ─── */
            <>
              <FormInput
                label="Título *"
                placeholder="Ex.: Reels barista convidada"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title)
                    {setFieldErrors((p) => ({ ...p, title: '' }));}
                }}
                error={fieldErrors.title}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Categoria"
                  value={categoryId}
                  onChange={(value) => {
                    setCategoryId(value);
                    setSubcategoryId('');
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </option>
                  ))}
                </FormSelect>

                <FormInput
                  label="Data de entrega *"
                  type="date"
                  value={dueDateStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDueDateStr(e.target.value);
                    if (fieldErrors.dueDate)
                      {setFieldErrors((p) => ({ ...p, dueDate: '' }));}
                  }}
                  error={fieldErrors.dueDate}
                />
              </div>

              {(selectedCategory?.subcategories.length ?? 0) > 0 && (
                <FormSelect label="Subcategoria" value={subcategoryId} onChange={setSubcategoryId}>
                  <option value="">Nenhuma</option>
                  {selectedCategory?.subcategories.map((s) => (
                    <option key={s.subcategoryId} value={s.subcategoryId}>
                      {s.name}
                    </option>
                  ))}
                </FormSelect>
              )}

              <FormInput
                as="textarea"
                label="Descrição"
                placeholder="Direção criativa, copy desejada, referências..."
                className="min-h-24 resize-none"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
              />

              <ReferenceLinks links={links} onChange={setLinks} />
              <ReferenceImages
                images={images}
                onChange={setImages}
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
                companyId={companyId}
              />
            </>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost-border"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createTask.isPending}
              className="btn-primary"
            >
              {createTask.isPending && <Spinner size={13} />}
              Enviar para aprovação
            </button>
          </div>
        )}

        {canApprove && (
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost-border"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approveTask.isPending}
              className="btn-primary"
            >
              {approveTask.isPending && <Spinner size={13} />}
              Aprovar tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
