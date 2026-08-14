import { MdWarning } from 'react-icons/md';

interface Props {
  description?: string;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  description = 'Você tem alterações não salvas. Se sair agora, elas serão perdidas.',
  onDiscard,
  onCancel,
}: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <MdWarning size={16} className="text-danger" />
          </div>
          <h2 className="text-[15px] font-bold text-text">Sair sem salvar?</h2>
        </div>
        <p className="mb-6 text-[13px] text-text-sub">{description}</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost-border">
            Continuar editando
          </button>
          <button type="button" onClick={onDiscard} className="btn-delete">
            Sair sem salvar
          </button>
        </div>
      </div>
    </div>
  );
}
