import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  MdOutlineAccountBalanceWallet,
  MdOutlineAttachMoney,
  MdOutlineCalculate,
  MdOutlineCampaign,
  MdOutlineHourglassBottom,
  MdOutlinePersonAddAlt,
} from 'react-icons/md';

import { StatCard } from '@/components/company/dashboard/stat-card.component';
import { AdAccountPicker } from '@/components/company/marketing/ad-account-picker.component';
import { AttentionPoints } from '@/components/company/marketing/attention-points.component';
import { CampaignPerformanceTable } from '@/components/company/marketing/campaign-performance-table.component';
import { DailyTrendChart } from '@/components/company/marketing/daily-trend-chart.component';
import { PeriodSelector } from '@/components/company/marketing/period-selector.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import { formatDateShort, formatTime } from '@/formatters/formatDate';
import {
  marketingDashboardQueryOptions,
  useSelectFacebookAdAccountMutation,
} from '@/queries/marketing-insights.queries';
import {
  computeAttentionPoints,
  computeCampaignPerformance,
  computeDailyTrend,
  computeMarketingTotals,
  estimateDaysOfBudgetRemaining,
  getPeriodRange,
  type MarketingPeriodPreset,
  type MarketingPeriodRange,
  type OkMarketingDashboard,
} from '@/utils/marketing-insights.util';

export const Route = createFileRoute('/_private/company/$companyId/marketing')(
  {
    loader: ({ context, params }) =>
      context.queryClient.ensureQueryData(
        marketingDashboardQueryOptions(params.companyId),
      ),
    component: CompanyMarketing,
    ssr: false,
  },
);

function formatUpdatedAt(updatedAt: number, now: number): string {
  const isToday = new Date(updatedAt).toDateString() === new Date(now).toDateString();
  const time = formatTime(updatedAt);
  return isToday ? `Atualizado hoje às ${time}` : `Atualizado em ${formatDateShort(updatedAt)} às ${time}`;
}

interface ConnectMetaCalloutProps {
  companyId: string;
  title: string;
  description: string;
}

function ConnectMetaCallout({ companyId, title, description }: ConnectMetaCalloutProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center animate-fade-in">
      <MdOutlineCampaign size={40} className="text-text-muted" />
      <div>
        <p className="text-[14px] font-semibold text-text-sub">{title}</p>
        <p className="mt-0.5 max-w-sm text-[12px] text-text-muted">{description}</p>
      </div>
      <Link
        to="/company/$companyId/integrations"
        params={{ companyId }}
        className="btn-primary"
      >
        Ir para Integrações
      </Link>
    </div>
  );
}

function CompanyMarketing() {
  const { companyId } = Route.useParams();
  const { data: dashboard } = useSuspenseQuery(marketingDashboardQueryOptions(companyId));
  const selectAdAccount = useSelectFacebookAdAccountMutation(companyId);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-black tracking-tight text-text">Marketing</h1>
          <p className="mt-1.5 text-[13px] text-text-sub">
            Acompanhe a performance das suas campanhas e investimentos em mídia.
          </p>
        </div>

        {dashboard.status === 'not_connected' && (
          <ConnectMetaCallout
            companyId={companyId}
            title="Conecte sua conta do Meta Ads"
            description="Conecte o Facebook Ads da empresa em Integrações para acompanhar aqui o desempenho das suas campanhas."
          />
        )}

        {dashboard.status === 'no_ads_permission' && (
          <ConnectMetaCallout
            companyId={companyId}
            title="Reconecte para liberar os dados de anúncios"
            description="A conexão atual não tem permissão para ler dados de campanhas. Reconecte sua conta do Facebook em Integrações."
          />
        )}

        {dashboard.status === 'no_account_selected' && (
          <AdAccountPicker
            adAccounts={dashboard.adAccounts}
            isPending={selectAdAccount.isPending}
            onSelect={(adAccountId) => selectAdAccount.mutate(adAccountId)}
          />
        )}

        {dashboard.status === 'ok' && <MarketingDashboardContent dashboard={dashboard} />}
      </div>
    </div>
  );
}

function MarketingDashboardContent({ dashboard }: { dashboard: OkMarketingDashboard }) {
  const [now] = useState(() => Date.now());
  const [preset, setPreset] = useState<MarketingPeriodPreset>('30d');
  const [customRange, setCustomRange] = useState<MarketingPeriodRange>(() =>
    getPeriodRange('30d', now),
  );

  const range = useMemo(
    () => (preset === 'custom' ? customRange : getPeriodRange(preset, now)),
    [preset, customRange, now],
  );

  const totals = useMemo(
    () => computeMarketingTotals(dashboard.dailyInsights, range),
    [dashboard, range],
  );
  const campaignPerformance = useMemo(
    () => computeCampaignPerformance(dashboard.dailyInsights, dashboard.campaigns, range),
    [dashboard, range],
  );
  const dailyTrend = useMemo(
    () => computeDailyTrend(dashboard.dailyInsights, range),
    [dashboard, range],
  );
  const daysRemaining = useMemo(
    () => estimateDaysOfBudgetRemaining(dashboard.balance, dashboard.dailyInsights, now),
    [dashboard, now],
  );
  const attentionPoints = useMemo(
    () => computeAttentionPoints(dashboard, campaignPerformance, daysRemaining, now),
    [dashboard, campaignPerformance, daysRemaining, now],
  );

  const activeCampaignsCount = useMemo(
    () => dashboard.campaigns.filter((c) => c.effectiveStatus === 'ACTIVE').length,
    [dashboard],
  );

  const currencyOptions = { currency: dashboard.currency, maximumFractionDigits: 2 };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5">
        <PeriodSelector
          preset={preset}
          customRange={customRange}
          onPresetChange={setPreset}
          onCustomRangeChange={setCustomRange}
        />
        <span className="text-[11px] text-text-muted">{formatUpdatedAt(dashboard.updatedAt, now)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<MdOutlineAttachMoney size={18} />}
          label="Investido"
          value={formatCurrency(totals.spend.value, currencyOptions)}
          trend={totals.spend.trend}
          trendLabel="vs período anterior"
        />
        <StatCard
          icon={<MdOutlinePersonAddAlt size={18} />}
          label="Leads gerados"
          value={String(totals.leads.value)}
          trend={totals.leads.trend}
          trendLabel="vs período anterior"
        />
        <StatCard
          icon={<MdOutlineCalculate size={18} />}
          label="CPL"
          value={totals.leads.value > 0 ? formatCurrency(totals.cpl.value, currencyOptions) : '—'}
          trend={totals.leads.value > 0 ? totals.cpl.trend : null}
          trendLabel="vs período anterior"
        />
        <StatCard
          icon={<MdOutlineCampaign size={18} />}
          label="Campanhas ativas"
          value={String(activeCampaignsCount)}
        />
        <StatCard
          icon={<MdOutlineAccountBalanceWallet size={18} />}
          label="Saldo"
          value={dashboard.balance !== null ? formatCurrency(dashboard.balance, currencyOptions) : '—'}
        />
        <StatCard
          icon={<MdOutlineHourglassBottom size={18} />}
          label="Dias de verba restantes"
          value={daysRemaining !== null ? `${daysRemaining} dias` : '—'}
        />
      </div>

      <AttentionPoints points={attentionPoints} />

      <DailyTrendChart points={dailyTrend} currency={dashboard.currency} />

      <CampaignPerformanceTable rows={campaignPerformance} currency={dashboard.currency} />
    </div>
  );
}
