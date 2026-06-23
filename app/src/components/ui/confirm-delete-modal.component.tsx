import { MdWarning } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  title,
  description,
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
          <MdWarning size={20} className="text-danger" />
        </div>
        <h2 className="mb-1 text-[15px] font-bold text-text">{title}</h2>
        <p className="mb-6 text-[13px] text-text-sub">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-text-sub transition-colors hover:bg-bg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isDeleting && <Spinner size={12} />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
