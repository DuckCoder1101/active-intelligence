import { useId, useState } from 'react';

import { formatCurrency } from '@/formatters/formatCurrency';
import type { DailyPoint } from '@/utils/marketing-insights.util';

type Metric = 'spend' | 'leads';

interface DailyTrendChartProps {
  points: DailyPoint[];
  currency: string;
}

const WIDTH = 640;
const HEIGHT = 160;
/** Evita poluir o eixo X quando o período tem muitos dias (ex: 90 no "Personalizado"). */
const MAX_AXIS_LABELS = 8;

function formatDayLabel(ts: number): string {
  return new Date(ts)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace('.', '');
}

export function DailyTrendChart({ points, currency }: DailyTrendChartProps) {
  const fillGradientId = useId();
  const strokeGradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>('spend');

  const values = points.map((p) => p[metric]);
  const max = Math.max(...values, 1);
  const stepX = points.length > 1 ? WIDTH / (points.length - 1) : WIDTH;

  const chartPoints = points.map((p, i) => ({
    x: i * stepX,
    y: HEIGHT - (p[metric] / max) * (HEIGHT - 16) - 4,
    point: p,
  }));

  const linePath = chartPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const hovered = hoverIndex !== null ? chartPoints[hoverIndex] : null;

  const labelEvery = Math.max(1, Math.ceil(points.length / MAX_AXIS_LABELS));

  return (
    <div className="dashboard-card flex flex-col p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-text">Evolução</h2>
        <div className="flex gap-0.5 rounded-md border border-border bg-card p-0.5">
          {(['spend', 'leads'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                metric === m ? 'bg-orange text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {m === 'spend' ? 'Investido' : 'Leads'}
            </button>
          ))}
        </div>
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
            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--color-primary-glow)' }} stopOpacity="0.45" />
              <stop offset="60%" style={{ stopColor: 'var(--color-primary)' }} stopOpacity="0.15" />
              <stop offset="100%" style={{ stopColor: 'var(--color-primary)' }} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" style={{ stopColor: 'var(--color-primary)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--color-primary-glow)' }} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${fillGradientId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chartPoints.map((pt, i) => (
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
            <p className="font-semibold text-text">
              {metric === 'spend'
                ? formatCurrency(hovered.point.spend, { currency, maximumFractionDigits: 2 })
                : `${hovered.point.leads} leads`}
            </p>
            <p className="text-text-muted">{formatDayLabel(hovered.point.date)}</p>
          </div>
        )}

        <div className="mt-2 flex justify-between text-[10px] text-text-muted">
          {points.map((p, i) => (
            <span key={p.date}>{i % labelEvery === 0 ? formatDayLabel(p.date) : ''}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
