import type {
  MarketingCampaign,
  MarketingDailyInsight,
  MarketingDashboard,
} from '@/models/marketing-insights.model';
import { percentChange, type TrendValue } from './dashboard-insights.util';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inRange(ts: number, start: number, end: number): boolean {
  return ts >= start && ts < end;
}

/** `date` é um bucket de dia calendário (yyyy-mm-dd) — interpretado à meia-noite local do navegador. */
export function parseDailyDate(date: string): number {
  return new Date(`${date}T00:00:00`).getTime();
}

export type MarketingPeriodPreset = '7d' | '30d' | 'month' | 'custom';

export interface MarketingPeriodRange {
  start: number;
  end: number;
}

/** O cache no backend mantém 90 dias — "Personalizado" além disso não tem dado. */
export const MARKETING_CACHE_RETENTION_DAYS = 90;

export function getPeriodRange(
  preset: MarketingPeriodPreset,
  now = Date.now(),
  custom?: MarketingPeriodRange,
): MarketingPeriodRange {
  const todayStart = startOfDay(now);
  const tomorrowStart = todayStart + DAY_MS;

  if (preset === 'custom') {
    return custom ?? { start: todayStart - 29 * DAY_MS, end: tomorrowStart };
  }
  if (preset === 'month') {
    return { start: startOfMonth(now), end: tomorrowStart };
  }
  const days = preset === '7d' ? 7 : 30;
  return { start: todayStart - (days - 1) * DAY_MS, end: tomorrowStart };
}

function getPreviousPeriodRange(range: MarketingPeriodRange): MarketingPeriodRange {
  const length = range.end - range.start;
  return { start: range.start - length, end: range.start };
}

function sumSpendAndLeads(
  dailyInsights: MarketingDailyInsight[],
  range: MarketingPeriodRange,
): { spend: number; leads: number } {
  let spend = 0;
  let leads = 0;
  for (const day of dailyInsights) {
    if (!inRange(parseDailyDate(day.date), range.start, range.end)) continue;
    for (const campaign of day.campaigns) {
      spend += campaign.spend;
      leads += campaign.leads;
    }
  }
  return { spend, leads };
}

function cplValue(spend: number, leads: number): number | null {
  return leads > 0 ? spend / leads : null;
}

export interface MarketingTotals {
  spend: TrendValue;
  leads: TrendValue;
  cpl: TrendValue;
}

/** Totais do período selecionado comparados com o período anterior de mesma duração. */
export function computeMarketingTotals(
  dailyInsights: MarketingDailyInsight[],
  range: MarketingPeriodRange,
): MarketingTotals {
  const current = sumSpendAndLeads(dailyInsights, range);
  const previous = sumSpendAndLeads(dailyInsights, getPreviousPeriodRange(range));

  const currentCpl = cplValue(current.spend, current.leads);
  const previousCpl = cplValue(previous.spend, previous.leads);

  return {
    spend: { value: current.spend, trend: percentChange(current.spend, previous.spend) },
    leads: { value: current.leads, trend: percentChange(current.leads, previous.leads) },
    cpl: {
      value: currentCpl ?? 0,
      trend:
        currentCpl !== null && previousCpl !== null
          ? percentChange(currentCpl, previousCpl)
          : null,
    },
  };
}

export interface CampaignPerformanceRow {
  campaignId: string;
  campaignName: string;
  status: string;
  effectiveStatus: string;
  spend: number;
  leads: number;
  cpl: number | null;
  isBest: boolean;
  isWorst: boolean;
}

/** Só inclui campanhas com atividade no período — uma linha 0/0 é ruído, não informação. */
export function computeCampaignPerformance(
  dailyInsights: MarketingDailyInsight[],
  campaigns: MarketingCampaign[],
  range: MarketingPeriodRange,
): CampaignPerformanceRow[] {
  const totals = new Map<string, { spend: number; leads: number }>();
  for (const day of dailyInsights) {
    if (!inRange(parseDailyDate(day.date), range.start, range.end)) continue;
    for (const campaign of day.campaigns) {
      const entry = totals.get(campaign.campaignId) ?? { spend: 0, leads: 0 };
      entry.spend += campaign.spend;
      entry.leads += campaign.leads;
      totals.set(campaign.campaignId, entry);
    }
  }

  const rows = campaigns
    .map((c) => {
      const t = totals.get(c.campaignId) ?? { spend: 0, leads: 0 };
      return {
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        status: c.status,
        effectiveStatus: c.effectiveStatus,
        spend: t.spend,
        leads: t.leads,
        cpl: cplValue(t.spend, t.leads),
      };
    })
    .filter((r) => r.spend > 0 || r.leads > 0)
    .sort((a, b) => b.spend - a.spend);

  const withLeads = rows.filter((r): r is typeof r & { cpl: number } => r.cpl !== null);
  const bestId =
    withLeads.length > 0
      ? withLeads.reduce((best, r) => (r.cpl < best.cpl ? r : best)).campaignId
      : null;
  const worstId =
    withLeads.length > 1
      ? withLeads.reduce((worst, r) => (r.cpl > worst.cpl ? r : worst)).campaignId
      : null;

  return rows.map((r) => ({
    ...r,
    isBest: r.campaignId === bestId,
    isWorst: r.campaignId === worstId,
  }));
}

export interface DailyPoint {
  date: number;
  spend: number;
  leads: number;
}

/** Preenche dias sem nenhuma linha (a Meta omite dias com zero atividade) com spend/leads = 0, pro gráfico não ter buracos. */
export function computeDailyTrend(
  dailyInsights: MarketingDailyInsight[],
  range: MarketingPeriodRange,
): DailyPoint[] {
  const byDate = new Map<number, { spend: number; leads: number }>();
  for (const day of dailyInsights) {
    const ts = parseDailyDate(day.date);
    if (!inRange(ts, range.start, range.end)) continue;
    const totals = day.campaigns.reduce(
      (acc, c) => ({ spend: acc.spend + c.spend, leads: acc.leads + c.leads }),
      { spend: 0, leads: 0 },
    );
    byDate.set(ts, totals);
  }

  const points: DailyPoint[] = [];
  for (let ts = range.start; ts < range.end; ts += DAY_MS) {
    const totals = byDate.get(ts) ?? { spend: 0, leads: 0 };
    points.push({ date: ts, spend: totals.spend, leads: totals.leads });
  }
  return points;
}

/** Baseado na média de gasto dos últimos 7 dias — null quando não há saldo ou não há gasto recente pra projetar. */
export function estimateDaysOfBudgetRemaining(
  balance: number | null,
  dailyInsights: MarketingDailyInsight[],
  now = Date.now(),
): number | null {
  if (balance === null || balance <= 0) return null;

  const { spend } = sumSpendAndLeads(dailyInsights, getPeriodRange('7d', now));
  const avgDailySpend = spend / 7;
  if (avgDailySpend <= 0) return null;

  return Math.round(balance / avgDailySpend);
}

export type AttentionPointSeverity = 'warning' | 'critical';

export interface AttentionPoint {
  id: string;
  severity: AttentionPointSeverity;
  message: string;
}

/**
 * Objetivos de campanha "de leads" na API da Meta — inclui o enum legado
 * (LEAD_GENERATION) e o atual, baseado em resultado (OUTCOME_LEADS). Sem
 * conta real disponível neste ambiente pra validar contra dados de produção;
 * mesmo cuidado do LEAD_ACTION_TYPES no backend.
 */
const LEAD_OBJECTIVES = new Set(['OUTCOME_LEADS', 'LEAD_GENERATION']);

/** O sync roda 2x/dia — mais que isso sem atualizar já indica um ciclo perdido. */
const STALE_HOURS = 30;

export type OkMarketingDashboard = Extract<MarketingDashboard, { status: 'ok' }>;

export function computeAttentionPoints(
  dashboard: OkMarketingDashboard,
  campaignPerformance: CampaignPerformanceRow[],
  daysRemaining: number | null,
  now = Date.now(),
): AttentionPoint[] {
  const points: AttentionPoint[] = [];

  if (dashboard.lastSyncError) {
    points.push({
      id: 'sync-error',
      severity: 'critical',
      message:
        'Não conseguimos atualizar os dados da Meta na última tentativa. Verifique a conexão em Integrações.',
    });
  }

  if (now - dashboard.updatedAt > STALE_HOURS * 60 * 60 * 1000) {
    points.push({
      id: 'stale-data',
      severity: 'warning',
      message: `Os dados não são atualizados há mais de ${STALE_HOURS} horas.`,
    });
  }

  const hasActiveCampaign = dashboard.campaigns.some((c) => c.effectiveStatus === 'ACTIVE');
  if (!hasActiveCampaign) {
    points.push({
      id: 'no-active-campaigns',
      severity: 'warning',
      message: 'Nenhuma campanha ativa no momento.',
    });
  }

  if (daysRemaining !== null && daysRemaining <= 7) {
    points.push({
      id: 'low-budget',
      severity: 'critical',
      message: `No ritmo atual de gastos, o saldo deve durar aproximadamente ${daysRemaining} dia(s).`,
    });
  }

  const campaignsById = new Map(dashboard.campaigns.map((c) => [c.campaignId, c]));
  for (const row of campaignPerformance) {
    const objective = campaignsById.get(row.campaignId)?.objective;
    const isLeadObjective = objective ? LEAD_OBJECTIVES.has(objective) : false;
    if (isLeadObjective && row.spend > 0 && row.leads === 0) {
      points.push({
        id: `zero-leads-${row.campaignId}`,
        severity: 'warning',
        message: `"${row.campaignName}" está gastando sem gerar leads.`,
      });
    }
  }

  return points;
}
