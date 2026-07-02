import { useState, useEffect } from 'react';
import {
  MdClose,
  MdDelete,
  MdPeople,
} from 'react-icons/md';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { ReferenceImages } from '@/components/tasks/reference-images.component';
import { ReferenceLinks } from '@/components/tasks/reference-links.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useSnackbar } from '@/contexts/snackbar.context';
import type { AdminProfile } from '@/models/admin.model';
import type { CompanyResume } from '@/models/company.model';
import type { KanbanColumn } from '@/models/kanban.model';
import { TASK_TYPES, TASK_TYPE_LABELS } from '@/models/task.model';
import type { Task, TaskType, SaveTaskDTO } from '@/models/task.model';
import { useDeleteTaskMutation, useSaveTaskMutation } from '@/queries/task.queries';

interface TaskModalProps {
  task?: Task;
  companies: CompanyResume[];
  admins: AdminProfile[];
  columns: KanbanColumn[];
  isOwner: boolean;
  currentUid: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
}


export function TaskModal({
  task,
  companies,
  admins,
  columns,
  isOwner,
  currentUid,
  onClose,
  onSaved,
  onDeleted,
}: TaskModalProps) {
  const { pushSnackbar } = useSnackbar();
  const saveTask = useSaveTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isEditing = !!task;
  const canEdit =
    isOwner ||
    !task ||
    task.assignedTo.length === 0 ||
    task.assignedTo.includes(currentUid);

  const [title, setTitle] = useState(task?.title ?? '');
  const [companyId, setCompanyId] = useState(task?.companyId ?? (companies[0]?.companyId ?? ''));
  const [type, setType] = useState<TaskType>(task?.type ?? 'feed');
  const [status, setStatus] = useState<string>(task?.status ?? (columns[0]?.columnId ?? 'requisitada'));
  const [dueDate, setDueDate] = useState(() => {
    if (task?.dueDate) {
      return new Date(task.dueDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [description, setDescription] = useState(task?.description ?? '');
  const [links, setLinks] = useState<string[]>(task?.referenceLinks ?? []);
  const [images, setImages] = useState<string[]>(task?.referenceImages ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [assignedTo, setAssignedTo] = useState<string[]>(task?.assignedTo ?? []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') {onClose();} };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const toggleAdmin = (uid: string) => {
    setAssignedTo((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    );
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {errs.title = 'Título obrigatório';}
    if (!companyId) {errs.companyId = 'Selecione uma empresa';}
    if (!dueDate) {errs.dueDate = 'Data de entrega obrigatória';}
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {return;}

    const dto: SaveTaskDTO = {
      ...(task?.taskId ? { taskId: task.taskId } : {}),
      companyId,
      title: title.trim(),
      description,
      type,
      status,
      dueDate: new Date(dueDate + 'T12:00:00').getTime(),
      ...(isOwner ? { assignedTo } : {}),
      referenceLinks: links,
      referenceImages: images,
    };

    saveTask.mutate(
      { dto, companyId, isEditing, pendingFiles },
      {
        onSuccess: (finalTask) => {
          pushSnackbar({
            type: 'success',
            message: isEditing ? 'Tarefa atualizada!' : 'Tarefa criada!',
          });
          onSaved(finalTask);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!task) {return;}
    deleteTask.mutate(task.taskId, {
      onSuccess: () => {
        pushSnackbar({ type: 'success', message: 'Tarefa excluída!' });
        onDeleted?.(task.taskId);
      },
    });
  };

  return (
    <>
      <div
        className="modal-overlay bg-black/50"
        onClick={(e) => { if (e.target === e.currentTarget) {onClose();} }}
      >
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-[15px] font-bold text-text">
              {isEditing ? 'Detalhes da tarefa' : 'Nova tarefa'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted transition-colors hover:text-text"
            >
              <MdClose size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Título */}
            <FormInput
              label="Título *"
              placeholder="Ex.: Reels barista convidada"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {setFieldErrors((p) => ({ ...p, title: '' }));}
              }}
              disabled={!canEdit}
              error={fieldErrors.title}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Empresa */}
              <FormInput
                as="select"
                label="Empresa *"
                value={companyId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setCompanyId(e.target.value);
                  if (fieldErrors.companyId) {setFieldErrors((p) => ({ ...p, companyId: '' }));}
                }}
                disabled={!canEdit || (isEditing && !isOwner)}
                error={fieldErrors.companyId}
              >
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.displayName}
                  </option>
                ))}
              </FormInput>

              {/* Tipo */}
              <FormInput
                as="select"
                label="Tipo"
                value={type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setType(e.target.value as TaskType)
                }
                disabled={!canEdit}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TASK_TYPE_LABELS[t]}
                  </option>
                ))}
              </FormInput>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <FormInput
                as="select"
                label="Quadro"
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setStatus(e.target.value)
                }
                disabled={!canEdit}
              >
                {columns.map((col) => (
                  <option key={col.columnId} value={col.columnId}>
                    {col.name}
                  </option>
                ))}
              </FormInput>

              {/* Data de entrega */}
              <FormInput
                label="Data de entrega *"
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDueDate(e.target.value);
                  if (fieldErrors.dueDate) {setFieldErrors((p) => ({ ...p, dueDate: '' }));}
                }}
                disabled={!canEdit}
                error={fieldErrors.dueDate}
              />
            </div>

            {/* Descrição */}
            <FormInput
              as="textarea"
              label="Descrição"
              placeholder="Direção criativa, copy desejada..."
              className="min-h-24 resize-none"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              disabled={!canEdit}
            />

            <ReferenceLinks
              links={links}
              onChange={canEdit ? setLinks : undefined}
              readonly={!canEdit}
            />

            <ReferenceImages
              images={images}
              onChange={canEdit ? setImages : undefined}
              pendingFiles={!isEditing ? pendingFiles : undefined}
              onPendingFilesChange={!isEditing && canEdit ? setPendingFiles : undefined}
              companyId={companyId}
              taskId={task?.taskId}
              readonly={!canEdit}
            />

            {/* Atribuição (owner only) */}
            {isOwner && admins.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
                  <MdPeople size={14} />
                  Responsáveis{' '}
                  <span className="font-normal text-text-muted">
                    (vazio = todos)
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {admins.map((admin) => {
                    const selected = assignedTo.includes(admin.uid);
                    return (
                      <button
                        key={admin.uid}
                        type="button"
                        onClick={() => toggleAdmin(admin.uid)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                          selected
                            ? 'border-orange bg-orange/10 text-orange'
                            : 'border-border text-text-sub hover:border-orange/50'
                        }`}
                      >
                        {admin.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div>
              {isOwner && isEditing && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger"
                >
                  <MdDelete size={15} />
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost-border"
              >
                Cancelar
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveTask.isPending}
                  className="btn-primary"
                >
                  {saveTask.isPending && <Spinner size={12} />}
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && task && (
        <ConfirmDeleteModal
          title="Excluir tarefa"
          description={`Excluir "${task.title}"? Esta ação não pode ser desfeita.`}
          isDeleting={deleteTask.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
