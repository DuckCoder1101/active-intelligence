import { useEffect, useState } from 'react';
import { MdClose, MdOutlineCalendarToday } from 'react-icons/md';

import { ReferenceImages } from '@/components/tasks/reference-images.component';
import { ReferenceLinks } from '@/components/tasks/reference-links.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useAuth } from '@/contexts/auth.context';
import { useSnackbar } from '@/contexts/snackbar.context';
import { formatDateLong } from '@/formatters/formatDate';
import type {
  Task,
  CreateClientTaskDTO,
  TaskStatus,
  TaskType,
} from '@/models/task.model';
import {
  TASK_TYPES,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@/models/task.model';
import { useCreateClientTaskMutation } from '@/queries/task.queries';

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  task?: Task;
  defaultDate?: Date;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export function ClientTaskModal({
  task,
  defaultDate,
  onClose,
  onCreated,
}: Props) {
  const isView = !!task;
  const { claims, userProfile: profile } = useAuth();
  const companyId = (claims?.accessLevel === 'user' ? claims.companyId : undefined) ?? '';
  const authorName = profile?.name ?? '';

  const { pushSnackbar } = useSnackbar();
  const createTask = useCreateClientTaskMutation();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [type, setType] = useState<TaskType>(task?.type ?? 'feed');
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
      type,
      dueDate,
      referenceLinks: links.length > 0 ? links : undefined,
      createdByName: authorName || undefined,
    };

    createTask.mutate(
      { dto, companyId, pendingFiles },
      {
        onSuccess: (finalTask) => {
          onCreated(finalTask);
          pushSnackbar({
            type: 'success',
            message: 'Tarefa enviada para aprovação!',
          });
          onClose();
        },
      },
    );
  };

  const status: TaskStatus = task?.approvalStatus ?? 'pending_approval';

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
                  <p className="form-label mb-1">Tipo</p>
                  <p className="text-[13px] text-text-sub">
                    {TASK_TYPE_LABELS[task.type]}
                  </p>
                </div>

                <div>
                  <p className="form-label mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${TASK_STATUS_COLORS[status]}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                    {TASK_STATUS_LABELS[status]}
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
                  label="Tipo"
                  value={type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setType(e.target.value as TaskType)
                  }
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TASK_TYPE_LABELS[t]}
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
      </div>
    </div>
  );
}
