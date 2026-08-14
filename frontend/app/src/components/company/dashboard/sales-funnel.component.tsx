import { Link } from '@tanstack/react-router';

import type { FunnelStage } from '@/utils/dashboard-insights.util';

interface SalesFunnelProps {
  companyId: string;
  stages: FunnelStage[];
}

const STAGE_HEIGHT = 34;
const STAGE_GAP = 3;
const SVG_WIDTH = 160;
/** Fixed shape: the funnel always tapers linearly from full width down to
 * this ratio at the last stage, regardless of lead counts or stage count —
 * only the printed numbers change with data. Keeps the outline a clean V
 * instead of flattening out when a company has many CRM columns. */
const MIN_WIDTH_RATIO = 0.32;
/** Cap so companies with many CRM columns don't blow up the card's height —
 * the "Ver funil completo" link covers the rest. Keeps the "Fechado(s)"
 * stage visible even when trimming — it's the funnel's outcome, unlike
 * "Perdido" which may sort after it in older column setups. */
const MAX_STAGES = 5;

function isClosedStageName(name: string): boolean {
  const normalized = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  return normalized === 'fechado' || normalized === 'fechados';
}

/** Fixed orange-to-red gradient, independent of each CRM column's configured
 * color, so the widget always reads as a single funnel visual. */
const GRADIENT_FROM = [255, 106, 0] as const; // --orange
const GRADIENT_TO = [183, 20, 47] as const; // deep red

function gradientColor(index: number, total: number): string {
  const t = total > 1 ? index / (total - 1) : 0;
  const [r1, g1, b1] = GRADIENT_FROM;
  const [r2, g2, b2] = GRADIENT_TO;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function SalesFunnel({ companyId, stages }: SalesFunnelProps) {
  const visibleStages = (() => {
    if (stages.length <= MAX_STAGES) {
      return stages;
    }
    const head = stages.slice(0, MAX_STAGES - 1);
    const closedStage =
      stages.find((s) => isClosedStageName(s.name)) ?? stages[stages.length - 1];
    if (head.some((s) => s.columnId === closedStage.columnId)) {
      return stages.slice(0, MAX_STAGES);
    }
    return [...head, closedStage];
  })();

  const widthStep =
    visibleStages.length > 1 ? (1 - MIN_WIDTH_RATIO) / (visibleStages.length - 1) : 0;
  const widthFor = (index: number) => {
    const ratio = 1 - index * widthStep;
    return SVG_WIDTH * ratio;
  };

  const svgHeight =
    visibleStages.length * STAGE_HEIGHT + Math.max(visibleStages.length - 1, 0) * STAGE_GAP;

  return (
    <div className="dashboard-card flex flex-1 flex-col p-4 sm:p-5">
      <h2 className="mb-4 text-[14px] font-bold text-text">Funil de vendas</h2>

      {stages.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-[12px] text-text-muted">
          Configure os quadros do CRM para ver o funil.
        </p>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <svg
            width={SVG_WIDTH}
            height={svgHeight}
            className="shrink-0"
            role="img"
            aria-label="Funil de vendas"
          >
            {visibleStages.map((stage, i) => {
              const topW = widthFor(i);
              const bottomW =
                i < visibleStages.length - 1 ? widthFor(i + 1) : topW * MIN_WIDTH_RATIO;
              const y = i * (STAGE_HEIGHT + STAGE_GAP);
              const topX = (SVG_WIDTH - topW) / 2;
              const bottomX = (SVG_WIDTH - bottomW) / 2;
              const points = `${topX},${y} ${topX + topW},${y} ${bottomX + bottomW},${y + STAGE_HEIGHT} ${bottomX},${y + STAGE_HEIGHT}`;
              const color = gradientColor(i, visibleStages.length);
              return (
                <g key={stage.columnId}>
                  <polygon points={points} fill={color} />
                  <text
                    x={SVG_WIDTH / 2}
                    y={y + STAGE_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[13px] font-bold tabular-nums"
                    fill="#fff"
                  >
                    {stage.count}
                  </text>
                </g>
              );
            })}
          </svg>

          <ul className="min-w-0 flex-1 pl-3">
            {visibleStages.map((stage, i) => (
              <li
                key={stage.columnId}
                className="flex items-center gap-2 text-[12px]"
                style={{ height: STAGE_HEIGHT + STAGE_GAP }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: gradientColor(i, visibleStages.length) }}
                />
                <span className="min-w-0 flex-1 truncate text-text-sub">
                  {stage.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-text">
                  {stage.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/company/$companyId/crm"
        params={{ companyId }}
        className="mt-4 self-start text-[12px] font-semibold text-orange transition-opacity hover:opacity-70"
      >
        Ver funil completo →
      </Link>
    </div>
  );
}
