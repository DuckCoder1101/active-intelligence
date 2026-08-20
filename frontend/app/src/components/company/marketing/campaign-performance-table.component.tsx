import { MdOutlineArrowDownward, MdOutlineArrowUpward } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import type { CampaignPerformanceRow } from '@/utils/marketing-insights.util';

const STATUS_VARIANTS: Record<string, 'success' | 'default' | 'danger'> = {
  ACTIVE: 'success',
  PAUSED: 'default',
  CAMPAIGN_PAUSED: 'default',
  ADSET_PAUSED: 'default',
  DISAPPROVED: 'danger',
  WITH_ISSUES: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  CAMPAIGN_PAUSED: 'Pausada',
  ADSET_PAUSED: 'Pausada',
  PENDING_REVIEW: 'Em análise',
  DISAPPROVED: 'Reprovada',
  WITH_ISSUES: 'Com problemas',
  PREAPPROVED: 'Pré-aprovada',
  PENDING_BILLING_INFO: 'Aguardando pagamento',
  IN_PROCESS: 'Em processamento',
};

interface CampaignPerformanceTableProps {
  rows: CampaignPerformanceRow[];
  currency: string;
}

export function CampaignPerformanceTable({ rows, currency }: CampaignPerformanceTableProps) {
  return (
    <div className="dashboard-card flex flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-text">Campanhas</h2>
        <span className="text-[11px] text-text-muted">Ordenadas por investimento</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-[13px] font-semibold text-text-sub">
            Nenhuma campanha com atividade nesse período
          </p>
          <p className="text-[12px] text-text-muted">
            Ajuste o período ou verifique as campanhas ativas na sua conta de anúncios.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] text-text-muted">
                <th className="pb-2 pr-3 font-medium">Campanha</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 text-right font-medium">Investido</th>
                <th className="pb-2 pr-3 text-right font-medium">Leads</th>
                <th className="pb-2 text-right font-medium">CPL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.campaignId} className="border-b border-border/60 last:border-0">
                  <td className="max-w-56 truncate py-2.5 pr-3 font-medium text-text">
                    {row.campaignName}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge variant={STATUS_VARIANTS[row.effectiveStatus] ?? 'default'}>
                      {STATUS_LABELS[row.effectiveStatus] ?? row.effectiveStatus}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-text">
                    {formatCurrency(row.spend, { currency, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-text">{row.leads}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {row.cpl === null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          row.isBest ? 'text-success' : row.isWorst ? 'text-danger' : 'text-text'
                        }`}
                      >
                        {row.isBest && <MdOutlineArrowDownward size={12} />}
                        {row.isWorst && <MdOutlineArrowUpward size={12} />}
                        {formatCurrency(row.cpl, { currency, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
