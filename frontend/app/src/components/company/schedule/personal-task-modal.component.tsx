import { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import type {
  PersonalTask,
  SavePersonalTaskDTO,
} from '@/models/personal-task.model';
import {
  useDeletePersonalTaskMutation,
  useSavePersonalTaskMutation,
} from '@/queries/personal-task.queries';

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  companyId: string;
  personalTask?: PersonalTask;
  defaultDate?: Date;
  onClose: () => void;
  onSaved: (task: PersonalTask) => void;
  onDeleted: (personalTaskId: string) => void;
}

export function PersonalTaskModal({
  companyId,
  personalTask,
  defaultDate,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const saveTask = useSavePersonalTaskMutation(companyId);
  const deleteTask = useDeletePersonalTaskMutation(companyId);

  const [title, setTitle] = useState(personalTask?.title ?? '');
  const [description, setDescription] = useState(
    personalTask?.description ?? '',
  );
  const [dueDateStr, setDueDateStr] = useState(
    personalTask
      ? toInputDate(new Date(personalTask.dueDate))
      : defaultDate
        ? toInputDate(defaultDate)
        : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Título obrigatório';
    }
    if (!dueDateStr) {
      errs.dueDate = 'Data obrigatória';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }

    const [year, month, day] = dueDateStr.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day, 12).getTime();

    const dto: SavePersonalTaskDTO = {
      personalTaskId: personalTask?.personalTaskId,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
    };

    saveTask.mutate(dto, {
      onSuccess: (saved) => {
        toast.success(
          personalTask ? 'Tarefa atualizada!' : 'Tarefa pessoal criada!',
        );
        onSaved(saved);
        onClose();
      },
    });
  };

  const handleDelete = () => {
    if (!personalTask) {
      return;
    }
    deleteTask.mutate(personalTask.personalTaskId, {
      onSuccess: () => {
        toast.success('Tarefa excluída!');
        onDeleted(personalTask.personalTaskId);
        onClose();
      },
    });
  };

  return (
    <div
      className="modal-overlay bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-500">
              Pessoal
            </span>
            <h2 className="text-[15px] font-bold text-text">
              {personalTask ? 'Tarefa pessoal' : 'Nova tarefa pessoal'}
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

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <FormInput
            label="Título *"
            placeholder="Ex.: Agendar visita apartamento."
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value);
              if (fieldErrors.title) {
                setFieldErrors((p) => ({ ...p, title: '' }));
              }
            }}
            error={fieldErrors.title}
          />

          <FormInput
            label="Data *"
            type="date"
            value={dueDateStr}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setDueDateStr(e.target.value);
              if (fieldErrors.dueDate) {
                setFieldErrors((p) => ({ ...p, dueDate: '' }));
              }
            }}
            error={fieldErrors.dueDate}
          />

          <FormInput
            as="textarea"
            label="Descrição"
            placeholder="Detalhes (opcional)"
            className="min-h-24 resize-none"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <div>
            {personalTask && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[12px] font-semibold text-danger transition-opacity hover:opacity-70"
              >
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
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saveTask.isPending}
              className="btn-primary"
            >
              {saveTask.isPending && <Spinner size={13} />}
              {personalTask ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Excluir tarefa pessoal"
          description={`Excluir "${personalTask?.title}"? Essa ação não pode ser desfeita.`}
          isDeleting={deleteTask.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
