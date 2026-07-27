import { useId, useState } from 'react';

import type { DailyPoint, WeeklyMetrics } from '@/utils/dashboard-insights.util';

interface PerformancePanelProps {
  series: DailyPoint[];
  metrics: WeeklyMetrics;
}

const WIDTH = 640;
const HEIGHT = 160;

function formatDayLabel(ts: number): string {
  return new Date(ts)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace('.', '');
}

interface MiniMetricProps {
  label: string;
  value: number;
  trend: number | null;
}

function MiniMetric({ label, value, trend }: MiniMetricProps) {
  return (
    <div>
      <p className="text-[11px] text-text-sub">{label}</p>
      <p className="mt-1 text-lg font-black text-text">{value}</p>
      {trend !== null && (
        <p
          className={`text-[11px] font-semibold ${trend >= 0 ? 'text-success' : 'text-danger'}`}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}

export function PerformancePanel({ series, metrics }: PerformancePanelProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = series.map((p) => p.leadsNovos);
  const max = Math.max(...values, 1);
  const stepX = series.length > 1 ? WIDTH / (series.length - 1) : WIDTH;

  const points = series.map((p, i) => ({
    x: i * stepX,
    y: HEIGHT - (p.leadsNovos / max) * (HEIGHT - 16) - 4,
    point: p,
  }));

  const linePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="card flex flex-col p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-text">Desempenho geral</h2>
        <span className="text-[11px] text-text-muted">Últimos 7 dias</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniMetric
          label="Leads novos"
          value={metrics.leadsNovos.value}
          trend={metrics.leadsNovos.trend}
        />
        <MiniMetric
          label="Negociações fechadas"
          value={metrics.negociacoesFechadas.value}
          trend={metrics.negociacoesFechadas.trend}
        />
        <MiniMetric
          label="Tarefas criadas"
          value={metrics.tarefasCriadas.value}
          trend={metrics.tarefasCriadas.trend}
        />
        <MiniMetric
          label="Tarefas concluídas"
          value={metrics.tarefasConcluidas.value}
          trend={metrics.tarefasConcluidas.trend}
        />
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: HEIGHT }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0.35" />
              <stop offset="100%" style={{ stopColor: 'var(--color-orange)' }} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            style={{ stroke: 'var(--color-orange)' }}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((pt, i) => (
            <rect
              key={pt.point.date}
              x={i === 0 ? 0 : pt.x - stepX / 2}
              y={0}
              width={stepX}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
          {hovered && (
            <>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={0}
                y2={HEIGHT}
                style={{ stroke: 'var(--color-border)' }}
                strokeWidth={1}
              />
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r={4}
                style={{ fill: 'var(--color-orange)', stroke: 'var(--color-card)' }}
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] shadow-lg"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: Math.max(hovered.y - 8, 0),
            }}
          >
            <p className="font-semibold text-text">{hovered.point.leadsNovos} leads</p>
            <p className="text-text-muted">{formatDayLabel(hovered.point.date)}</p>
          </div>
        )}

        <div className="mt-2 flex justify-between text-[10px] text-text-muted">
          {series.map((p) => (
            <span key={p.date}>{formatDayLabel(p.date)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
