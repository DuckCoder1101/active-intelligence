import type { CrmColumn, Lead } from '@/models/lead.model';
import { APPROVED_COLUMN_ID } from '@/models/operational-kanban.model';
import type { Task } from '@/models/task.model';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(ts: number): number {
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

/** Percent change vs a baseline. Null when growth from zero is undefined. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export interface TrendValue {
  value: number;
  trend: number | null;
}

export interface LeadStats {
  newLeads: TrendValue;
  activeDeals: TrendValue;
  conversionRate: TrendValue;
}

/** Month-to-date lead stats compared against the same point in the previous month. */
export function computeLeadStats(leads: Lead[], now = Date.now()): LeadStats {
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(thisMonthStart - DAY_MS);
  const lastMonthEnd = thisMonthStart;

  const newThisMonth = leads.filter((l) => inRange(l.createdAt, thisMonthStart, now)).length;
  const newLastMonth = leads.filter((l) => inRange(l.createdAt, lastMonthStart, lastMonthEnd)).length;

  const activeNow = leads.filter((l) => l.dealStatus === 'aberto').length;
  const activeCreatedThisMonth = leads.filter(
    (l) => l.dealStatus === 'aberto' && inRange(l.createdAt, thisMonthStart, now),
  ).length;
  const activeCreatedLastMonth = leads.filter(
    (l) => l.dealStatus === 'aberto' && inRange(l.createdAt, lastMonthStart, lastMonthEnd),
  ).length;

  const decidedThisMonth = leads.filter(
    (l) => l.dealStatus !== 'aberto' && inRange(l.updatedAt, thisMonthStart, now),
  );
  const decidedLastMonth = leads.filter(
    (l) => l.dealStatus !== 'aberto' && inRange(l.updatedAt, lastMonthStart, lastMonthEnd),
  );
  const conversionThisMonth =
    decidedThisMonth.length > 0
      ? (decidedThisMonth.filter((l) => l.dealStatus === 'vendido').length / decidedThisMonth.length) * 100
      : 0;
  const conversionLastMonth =
    decidedLastMonth.length > 0
      ? (decidedLastMonth.filter((l) => l.dealStatus === 'vendido').length / decidedLastMonth.length) * 100
      : 0;

  return {
    newLeads: { value: newThisMonth, trend: percentChange(newThisMonth, newLastMonth) },
    activeDeals: { value: activeNow, trend: percentChange(activeCreatedThisMonth, activeCreatedLastMonth) },
    conversionRate: {
      value: Math.round(conversionThisMonth * 10) / 10,
      trend: percentChange(conversionThisMonth, conversionLastMonth),
    },
  };
}

export interface FunnelStage {
  columnId: string;
  name: string;
  color: string;
  count: number;
}

/** Lead counts per CRM board column, in the company's configured order. */
export function computeFunnel(leads: Lead[], columns: CrmColumn[]): FunnelStage[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  return [...columns]
    .sort((a, b) => a.order - b.order)
    .map((col) => ({
      columnId: col.columnId,
      name: col.name,
      color: col.color,
      count: counts.get(col.columnId) ?? 0,
    }));
}

export function getTasksOnDay(tasks: Task[], day: number): Task[] {
  const start = startOfDay(day);
  const end = start + DAY_MS;
  return tasks
    .filter((t) => inRange(t.dueDate, start, end))
    .sort((a, b) => a.dueDate - b.dueDate);
}

/** Tasks due from today through the next `days - 1` days, inclusive. */
export function getUpcomingTasks(tasks: Task[], now = Date.now(), days = 7): Task[] {
  const start = startOfDay(now);
  const end = start + days * DAY_MS;
  return tasks
    .filter((t) => inRange(t.dueDate, start, end))
    .sort((a, b) => a.dueDate - b.dueDate);
}

export interface DailyPoint {
  date: number;
  leadsNovos: number;
}

/** Daily new-lead counts for the trailing `days` days, including today. */
export function computeDailyLeadSeries(leads: Lead[], now = Date.now(), days = 7): DailyPoint[] {
  const todayStart = startOfDay(now);
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = todayStart - i * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    points.push({
      date: dayStart,
      leadsNovos: leads.filter((l) => inRange(l.createdAt, dayStart, dayEnd)).length,
    });
  }
  return points;
}

export interface WeeklyMetrics {
  leadsNovos: TrendValue;
  negociacoesFechadas: TrendValue;
  tarefasCriadas: TrendValue;
  tarefasConcluidas: TrendValue;
}

/** Trailing-7-day totals compared against the previous 7-day window. */
export function computeWeeklyMetrics(leads: Lead[], tasks: Task[], now = Date.now()): WeeklyMetrics {
  const todayStart = startOfDay(now);
  const windowEnd = todayStart + DAY_MS;
  const weekStart = todayStart - 6 * DAY_MS;
  const prevWeekStart = weekStart - 7 * DAY_MS;
  const prevWeekEnd = weekStart;

  const leadsNovos = leads.filter((l) => inRange(l.createdAt, weekStart, windowEnd)).length;
  const leadsNovosPrev = leads.filter((l) => inRange(l.createdAt, prevWeekStart, prevWeekEnd)).length;

  const negociacoesFechadas = leads.filter(
    (l) => l.dealStatus === 'vendido' && inRange(l.updatedAt, weekStart, windowEnd),
  ).length;
  const negociacoesFechadasPrev = leads.filter(
    (l) => l.dealStatus === 'vendido' && inRange(l.updatedAt, prevWeekStart, prevWeekEnd),
  ).length;

  const tarefasCriadas = tasks.filter((t) => inRange(t.createdAt, weekStart, windowEnd)).length;
  const tarefasCriadasPrev = tasks.filter((t) => inRange(t.createdAt, prevWeekStart, prevWeekEnd)).length;

  const tarefasConcluidas = tasks.filter(
    (t) => t.status === APPROVED_COLUMN_ID && inRange(t.updatedAt, weekStart, windowEnd),
  ).length;
  const tarefasConcluidasPrev = tasks.filter(
    (t) => t.status === APPROVED_COLUMN_ID && inRange(t.updatedAt, prevWeekStart, prevWeekEnd),
  ).length;

  return {
    leadsNovos: { value: leadsNovos, trend: percentChange(leadsNovos, leadsNovosPrev) },
    negociacoesFechadas: {
      value: negociacoesFechadas,
      trend: percentChange(negociacoesFechadas, negociacoesFechadasPrev),
    },
    tarefasCriadas: { value: tarefasCriadas, trend: percentChange(tarefasCriadas, tarefasCriadasPrev) },
    tarefasConcluidas: {
      value: tarefasConcluidas,
      trend: percentChange(tarefasConcluidas, tarefasConcluidasPrev),
    },
  };
}
