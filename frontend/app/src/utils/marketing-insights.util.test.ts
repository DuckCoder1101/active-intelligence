import { describe, expect, it } from 'vitest';

import type { MarketingCampaign, MarketingDailyInsight } from '@/models/marketing-insights.model';
import {
  computeAttentionPoints,
  computeCampaignPerformance,
  computeDailyTrend,
  computeMarketingTotals,
  estimateDaysOfBudgetRemaining,
  getPeriodRange,
  parseDailyDate,
  type OkMarketingDashboard,
} from './marketing-insights.util';

// 2026-08-20 12:00:00 local — meio do dia pra evitar ambiguidade de fuso nos testes.
const NOW = new Date(2026, 7, 20, 12, 0, 0).getTime();

const CAMPAIGNS: MarketingCampaign[] = [
  { campaignId: 'camp-1', campaignName: 'Campanha Lançamento', status: 'ACTIVE', effectiveStatus: 'ACTIVE', objective: 'OUTCOME_LEADS' },
  { campaignId: 'camp-2', campaignName: 'Campanha Institucional', status: 'ACTIVE', effectiveStatus: 'ACTIVE', objective: 'OUTCOME_AWARENESS' },
];

function daily(date: string, campaigns: { campaignId: string; spend: number; leads: number }[]): MarketingDailyInsight {
  return { date, campaigns };
}

describe('getPeriodRange', () => {
  it('7d cobre os últimos 7 dias incluindo hoje', () => {
    const range = getPeriodRange('7d', NOW);
    const days = Math.round((range.end - range.start) / (24 * 60 * 60 * 1000));
    expect(days).toBe(7);
    expect(range.end).toBeGreaterThan(NOW);
  });

  it('month começa no dia 1 do mês corrente', () => {
    const range = getPeriodRange('month', NOW);
    expect(new Date(range.start).getDate()).toBe(1);
  });

  it('custom usa o range informado', () => {
    const custom = { start: 1000, end: 2000 };
    expect(getPeriodRange('custom', NOW, custom)).toEqual(custom);
  });
});

describe('computeMarketingTotals', () => {
  it('soma spend/leads no período e calcula CPL', () => {
    const dailyInsights = [
      daily('2026-08-19', [{ campaignId: 'camp-1', spend: 100, leads: 5 }]),
      daily('2026-08-20', [{ campaignId: 'camp-1', spend: 50, leads: 0 }]),
    ];
    const range = { start: parseDailyDate('2026-08-19'), end: parseDailyDate('2026-08-21') };

    const totals = computeMarketingTotals(dailyInsights, range);

    expect(totals.spend.value).toBe(150);
    expect(totals.leads.value).toBe(5);
    expect(totals.cpl.value).toBe(30);
  });

  it('cpl trend é null quando não há leads no período atual ou anterior', () => {
    const dailyInsights = [daily('2026-08-20', [{ campaignId: 'camp-1', spend: 100, leads: 0 }])];
    const range = { start: parseDailyDate('2026-08-20'), end: parseDailyDate('2026-08-21') };

    const totals = computeMarketingTotals(dailyInsights, range);

    expect(totals.cpl.trend).toBeNull();
  });
});

describe('computeCampaignPerformance', () => {
  it('só inclui campanhas com atividade no período, ordenadas por spend desc', () => {
    const dailyInsights = [
      daily('2026-08-20', [
        { campaignId: 'camp-1', spend: 200, leads: 4 },
        { campaignId: 'camp-2', spend: 50, leads: 0 },
      ]),
    ];
    const range = { start: parseDailyDate('2026-08-20'), end: parseDailyDate('2026-08-21') };

    const rows = computeCampaignPerformance(dailyInsights, CAMPAIGNS, range);

    expect(rows.map((r) => r.campaignId)).toEqual(['camp-1', 'camp-2']);
  });

  it('marca a menor CPL como melhor e a maior como pior', () => {
    const dailyInsights = [
      daily('2026-08-20', [
        { campaignId: 'camp-1', spend: 100, leads: 10 }, // CPL 10
        { campaignId: 'camp-2', spend: 100, leads: 2 }, // CPL 50
      ]),
    ];
    const range = { start: parseDailyDate('2026-08-20'), end: parseDailyDate('2026-08-21') };

    const rows = computeCampaignPerformance(dailyInsights, CAMPAIGNS, range);

    const camp1 = rows.find((r) => r.campaignId === 'camp-1')!;
    const camp2 = rows.find((r) => r.campaignId === 'camp-2')!;
    expect(camp1.isBest).toBe(true);
    expect(camp2.isWorst).toBe(true);
  });
});

describe('computeDailyTrend', () => {
  it('preenche com zero os dias sem nenhuma linha no cache', () => {
    const dailyInsights = [daily('2026-08-20', [{ campaignId: 'camp-1', spend: 100, leads: 2 }])];
    const range = { start: parseDailyDate('2026-08-18'), end: parseDailyDate('2026-08-21') };

    const points = computeDailyTrend(dailyInsights, range);

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ date: parseDailyDate('2026-08-18'), spend: 0, leads: 0 });
    expect(points[2]).toEqual({ date: parseDailyDate('2026-08-20'), spend: 100, leads: 2 });
  });
});

describe('estimateDaysOfBudgetRemaining', () => {
  it('divide o saldo pela média de gasto dos últimos 7 dias', () => {
    const dailyInsights = Array.from({ length: 7 }, (_, i) =>
      daily(
        new Date(NOW - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        [{ campaignId: 'camp-1', spend: 100, leads: 1 }],
      ),
    );

    const days = estimateDaysOfBudgetRemaining(700, dailyInsights, NOW);

    expect(days).toBe(7);
  });

  it('devolve null quando não há saldo', () => {
    expect(estimateDaysOfBudgetRemaining(null, [], NOW)).toBeNull();
  });

  it('devolve null quando não há gasto recente pra projetar', () => {
    expect(estimateDaysOfBudgetRemaining(500, [], NOW)).toBeNull();
  });
});

describe('computeAttentionPoints', () => {
  const baseDashboard: OkMarketingDashboard = {
    status: 'ok',
    adAccountName: 'Conta Teste',
    currency: 'BRL',
    balance: 1000,
    campaigns: CAMPAIGNS,
    dailyInsights: [],
    updatedAt: NOW,
  };

  it('sinaliza erro de sincronização quando lastSyncError está presente', () => {
    const points = computeAttentionPoints({ ...baseDashboard, lastSyncError: 'token expirado' }, [], null, NOW);
    expect(points.some((p) => p.id === 'sync-error')).toBe(true);
  });

  it('sinaliza dados desatualizados há mais de 30h', () => {
    const staleUpdatedAt = NOW - 31 * 60 * 60 * 1000;
    const points = computeAttentionPoints({ ...baseDashboard, updatedAt: staleUpdatedAt }, [], null, NOW);
    expect(points.some((p) => p.id === 'stale-data')).toBe(true);
  });

  it('sinaliza campanha de leads gastando sem gerar leads', () => {
    const rows = [
      {
        campaignId: 'camp-1',
        campaignName: 'Campanha Lançamento',
        status: 'ACTIVE',
        effectiveStatus: 'ACTIVE',
        spend: 100,
        leads: 0,
        cpl: null,
        isBest: false,
        isWorst: false,
      },
    ];
    const points = computeAttentionPoints(baseDashboard, rows, null, NOW);
    expect(points.some((p) => p.id === 'zero-leads-camp-1')).toBe(true);
  });

  it('não sinaliza campanha sem objetivo de leads gastando sem leads', () => {
    const rows = [
      {
        campaignId: 'camp-2',
        campaignName: 'Campanha Institucional',
        status: 'ACTIVE',
        effectiveStatus: 'ACTIVE',
        spend: 100,
        leads: 0,
        cpl: null,
        isBest: false,
        isWorst: false,
      },
    ];
    const points = computeAttentionPoints(baseDashboard, rows, null, NOW);
    expect(points.some((p) => p.id === 'zero-leads-camp-2')).toBe(false);
  });

  it('devolve lista vazia quando está tudo bem', () => {
    const points = computeAttentionPoints(baseDashboard, [], null, NOW);
    expect(points).toEqual([]);
  });
});
