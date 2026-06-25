import { Spinner } from '@/components/ui/spinner.component';

interface SaveBarProps {
  isDirty: boolean;
  isSaving?: boolean;
  formId: string;
  onDiscard: () => void;
  label?: string;
}

export function SaveBar({
  isDirty,
  isSaving = false,
  formId,
  onDiscard,
  label = 'Salvar alterações',
}: SaveBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-6 py-4 shadow-lg backdrop-blur-sm transition-transform duration-200 ${
        isDirty ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-[13px] text-text-muted">Há alterações não salvas.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg px-5 py-2 text-[13px] font-semibold text-text-sub transition-colors hover:bg-bg"
          >
            Descartar
          </button>
          <button
            form={formId}
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-orange px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isSaving && <Spinner size={12} />}
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}
