import { MdOutlineAccountBalanceWallet } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import type { FacebookAdAccount } from '@/models/meta-integration.model';

interface AdAccountPickerProps {
  adAccounts: FacebookAdAccount[];
  onSelect: (adAccountId: string) => void;
  isPending: boolean;
}

export function AdAccountPicker({ adAccounts, onSelect, isPending }: AdAccountPickerProps) {
  if (adAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
        <MdOutlineAccountBalanceWallet size={40} className="text-text-muted" />
        <div>
          <p className="text-[14px] font-semibold text-text-sub">
            Nenhuma conta de anúncios encontrada
          </p>
          <p className="mt-0.5 max-w-sm text-[12px] text-text-muted">
            Não encontramos nenhuma conta de anúncios vinculada a este usuário do Facebook. Crie
            uma no Gerenciador de Anúncios da Meta e reconecte por Integrações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-[14px] font-bold text-text">Escolha a conta de anúncios</h2>
      <p className="mt-1 text-[12px] text-text-sub">
        Encontramos mais de uma conta de anúncios conectada. Selecione qual delas alimenta este
        dashboard.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {adAccounts.map((account) => (
          <button
            key={account.adAccountId}
            type="button"
            disabled={isPending}
            onClick={() => onSelect(account.adAccountId)}
            className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-orange disabled:opacity-60"
          >
            <div>
              <p className="text-[13px] font-semibold text-text">{account.adAccountName}</p>
              <p className="text-[11px] text-text-muted">{account.currency}</p>
            </div>
            {isPending && <Spinner size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}
