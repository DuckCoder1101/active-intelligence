import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  /** Renderiza footer padrão com Cancelar + Salvar vinculado ao formId */
  formId?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  saveLabel?: string;
  /** Footer customizado — use quando o padrão não atender */
  footer?: React.ReactNode;
};

export function Modal({
  title,
  onClose,
  children,
  width = 'max-w-2xl',
  formId,
  isSaving,
  saveDisabled,
  saveLabel = 'Salvar',
  footer,
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const standardFooter = formId && (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onClose} className="btn-ghost">
        Cancelar
      </button>
      <button
        form={formId}
        type="submit"
        disabled={isSaving || saveDisabled}
        className="btn-primary"
      >
        {isSaving && <Spinner size={12} />}
        {saveLabel}
      </button>
    </div>
  );

  const resolvedFooter = standardFooter ?? footer;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div
        className={`relative z-10 flex w-full ${width} max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-card shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-[16px] font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            <MdClose size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {resolvedFooter && (
          <div className="shrink-0 border-t border-border px-6 py-4">
            {resolvedFooter}
          </div>
        )}
      </div>
    </div>
  );
}
