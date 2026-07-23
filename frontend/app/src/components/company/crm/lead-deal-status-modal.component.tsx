import { MdOutlineInfo } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import { DEAL_STATUS_LABELS } from '@/models/lead.model';
import type { DealStatus } from '@/models/lead.model';

interface LeadDealStatusModalProps {
  leadName: string;
  to: DealStatus;
  isSaving?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DESCRIPTIONS: Record<DealStatus, (name: string) => string> = {
  vendido: (name) => `Marcar "${name}" como Vendido?`,
  perdido: (name) => `Marcar "${name}" como Perdido?`,
  aberto: (name) =>
    `Reabrir "${name}"? Ele volta a aparecer no filtro "Aberto".`,
};

export function LeadDealStatusModal({
  leadName,
  to,
  isSaving = false,
  onConfirm,
  onCancel,
}: LeadDealStatusModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/10">
            <MdOutlineInfo size={16} className="text-orange" />
          </div>
          <h2 className="text-[15px] font-bold text-text">
            Alterar status do lead
          </h2>
        </div>
        <p className="mb-6 text-[13px] text-text-sub">
          {DESCRIPTIONS[to](leadName)}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="btn-ghost"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving && <Spinner size={12} />}
            Confirmar {DEAL_STATUS_LABELS[to]}
          </button>
        </div>
      </div>
    </div>
  );
}
