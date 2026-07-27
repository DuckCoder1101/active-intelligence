import { Link } from '@tanstack/react-router';

import type { FunnelStage } from '@/utils/dashboard-insights.util';

interface SalesFunnelProps {
  companyId: string;
  stages: FunnelStage[];
}

const STAGE_HEIGHT = 30;
const STAGE_GAP = 4;
const SVG_WIDTH = 150;
const MIN_WIDTH_RATIO = 0.3;

export function SalesFunnel({ companyId, stages }: SalesFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  const widthFor = (count: number) => {
    const ratio = MIN_WIDTH_RATIO + (1 - MIN_WIDTH_RATIO) * (count / maxCount);
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
        <div className="flex flex-1 items-center gap-6">
          <svg
            width={SVG_WIDTH}
            height={svgHeight}
            className="shrink-0"
            aria-hidden="true"
          >
            {stages.map((stage, i) => {
              const topW = widthFor(stage.count);
              const bottomW =
                i < stages.length - 1 ? widthFor(stages[i + 1].count) : topW * 0.88;
              const y = i * (STAGE_HEIGHT + STAGE_GAP);
              const topX = (SVG_WIDTH - topW) / 2;
              const bottomX = (SVG_WIDTH - bottomW) / 2;
              const points = `${topX},${y} ${topX + topW},${y} ${bottomX + bottomW},${y + STAGE_HEIGHT} ${bottomX},${y + STAGE_HEIGHT}`;
              return (
                <polygon key={stage.columnId} points={points} fill={stage.color} />
              );
            })}
          </svg>

          <ul className="min-w-0 flex-1 space-y-2.5">
            {stages.map((stage) => (
              <li
                key={stage.columnId}
                className="flex items-center justify-between gap-2 text-[12px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="truncate text-text-sub">{stage.name}</span>
                </span>
                <span className="shrink-0 font-bold text-text">{stage.count}</span>
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
