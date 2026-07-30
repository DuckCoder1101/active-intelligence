import { Link } from '@tanstack/react-router';

import type { FunnelStage } from '@/utils/dashboard-insights.util';

interface SalesFunnelProps {
  companyId: string;
  stages: FunnelStage[];
}

const STAGE_HEIGHT = 34;
const STAGE_GAP = 3;
const SVG_WIDTH = 160;
/** Fixed shape: each stage is this much narrower than the previous one,
 * regardless of lead counts — only the printed numbers change with data. */
const STAGE_WIDTH_STEP = 0.16;
const MIN_WIDTH_RATIO = 0.32;

export function SalesFunnel({ companyId, stages }: SalesFunnelProps) {
  const widthFor = (index: number) => {
    const ratio = Math.max(MIN_WIDTH_RATIO, 1 - index * STAGE_WIDTH_STEP);
    return SVG_WIDTH * ratio;
  };

  const svgHeight =
    stages.length * STAGE_HEIGHT + Math.max(stages.length - 1, 0) * STAGE_GAP;

  return (
    <div className="card flex flex-1 flex-col p-4 sm:p-5">
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
            {stages.map((stage, i) => {
              const topW = widthFor(i);
              const bottomW =
                i < stages.length - 1 ? widthFor(i + 1) : topW * MIN_WIDTH_RATIO;
              const y = i * (STAGE_HEIGHT + STAGE_GAP);
              const topX = (SVG_WIDTH - topW) / 2;
              const bottomX = (SVG_WIDTH - bottomW) / 2;
              const points = `${topX},${y} ${topX + topW},${y} ${bottomX + bottomW},${y + STAGE_HEIGHT} ${bottomX},${y + STAGE_HEIGHT}`;
              return (
                <g key={stage.columnId}>
                  <polygon points={points} fill={stage.color} />
                  <text
                    x={SVG_WIDTH / 2}
                    y={y + STAGE_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[13px] font-bold"
                    fill="#fff"
                  >
                    {stage.count}
                  </text>
                </g>
              );
            })}
          </svg>

          <ul className="min-w-0 flex-1 space-y-2.5 pl-6">
            {stages.map((stage) => (
              <li
                key={stage.columnId}
                className="flex items-center gap-2 text-[12px]"
                style={{ height: STAGE_HEIGHT + STAGE_GAP }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="truncate text-text-sub">{stage.name}</span>
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
