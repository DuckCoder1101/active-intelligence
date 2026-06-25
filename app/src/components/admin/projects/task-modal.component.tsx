import { useState, useEffect, useRef } from 'react';
import {
  MdClose,
  MdAdd,
  MdDelete,
  MdLink,
  MdImage,
  MdPeople,
} from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import { FormInput } from '@/components/ui/form-input.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import TaskService from '@/services/task.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

import type { Task, TaskType, SaveTaskDTO } from '@/models/task.model';
import { TASK_TYPES, TASK_TYPE_LABELS } from '@/models/task.model';
import type { KanbanColumn } from '@/models/kanban.model';
import type { CompanyResume } from '@/models/company.model';
import type { UserProfile } from '@/models/user.model';

interface TaskModalProps {
  task?: Task;
  companies: CompanyResume[];
  admins: UserProfile[];
  columns: KanbanColumn[];
  isOwner: boolean;
  currentUid: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
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
  const [linkInput, setLinkInput] = useState('');
  const [images, setImages] = useState<string[]>(task?.referenceImages ?? []);
  const [assignedTo, setAssignedTo] = useState<string[]>(task?.assignedTo ?? []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const addLink = () => {
    const v = linkInput.trim();
    if (!v) return;
    const url = v.startsWith('http') ? v : `https://${v}`;
    setLinks((prev) => [...prev, url]);
    setLinkInput('');
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const cId = companyId;
    const tId = task?.taskId ?? generateId();

    setUploadingImages(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => TaskService.uploadImage(cId, tId, f)),
      );
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      handleError(err);
    } finally {
      setUploadingImages(false);
    }
  };

  const toggleAdmin = (uid: string) => {
    setAssignedTo((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    );
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Título obrigatório';
    if (!companyId) errs.companyId = 'Selecione uma empresa';
    if (!dueDate) errs.dueDate = 'Data de entrega obrigatória';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

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

    setIsSaving(true);
    try {
      const saved = await TaskService.saveTask(dto);
      pushSnackbar({
        type: 'success',
        message: isEditing ? 'Tarefa atualizada!' : 'Tarefa criada!',
      });
      onSaved(saved);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await TaskService.deleteTask(task.taskId);
      pushSnackbar({ type: 'success', message: 'Tarefa excluída!' });
      onDeleted?.(task.taskId);
    } catch (err) {
      handleError(err);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
                if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' }));
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
                  if (fieldErrors.companyId) setFieldErrors((p) => ({ ...p, companyId: '' }));
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
                  if (fieldErrors.dueDate) setFieldErrors((p) => ({ ...p, dueDate: '' }));
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

            {/* Links de referência */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
                <MdLink size={14} />
                Links de referência
              </p>
              {canEdit && (
                <div className="mb-2 flex gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text placeholder-text-muted outline-none focus:border-orange"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="rounded-lg border border-border px-3 py-2 text-[13px] text-text-sub transition-colors hover:bg-bg"
                  >
                    <MdAdd size={16} />
                  </button>
                </div>
              )}
              <div className="space-y-1.5">
                {links.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-[12px] text-blue-500 hover:underline"
                    >
                      {link}
                    </a>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
                        className="shrink-0 text-text-muted hover:text-danger"
                      >
                        <MdClose size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Imagens de referência */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
                <MdImage size={14} />
                Imagens de referência
              </p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="group relative aspect-square">
                    <img
                      src={url}
                      alt={`ref-${i}`}
                      className="h-full w-full rounded-lg object-cover border border-border"
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
                      >
                        <MdClose size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages || !companyId}
                    className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-text-muted transition-colors hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingImages ? (
                      <Spinner size={16} />
                    ) : (
                      <MdAdd size={22} />
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)}
              />
            </div>

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
                  className="flex items-center gap-1.5 rounded-xl border border-danger/30 px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10"
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
                className="rounded-xl border border-border px-5 py-2 text-[13px] font-semibold text-text-sub transition-colors hover:bg-bg"
              >
                Cancelar
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-orange px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {isSaving && <Spinner size={12} />}
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
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
