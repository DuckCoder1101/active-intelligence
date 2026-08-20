import { MdOutlineCheckCircle, MdOutlineError, MdOutlineWarningAmber } from 'react-icons/md';

import type { AttentionPoint } from '@/utils/marketing-insights.util';

interface AttentionPointsProps {
  points: AttentionPoint[];
}

export function AttentionPoints({ points }: AttentionPointsProps) {
  return (
    <div className="dashboard-card flex flex-col p-4 sm:p-5">
      <h2 className="mb-4 text-[14px] font-bold text-text">Pontos de atenção</h2>

      {points.length === 0 ? (
        <div className="flex items-center gap-2.5 text-[12px] text-text-sub">
          <MdOutlineCheckCircle size={18} className="shrink-0 text-success" />
          Nenhum ponto de atenção — suas campanhas estão indo bem.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {points.map((point) => (
            <li key={point.id} className="flex items-start gap-2.5 text-[12px] text-text-sub">
              {point.severity === 'critical' ? (
                <MdOutlineError size={18} className="mt-0.5 shrink-0 text-danger" />
              ) : (
                <MdOutlineWarningAmber size={18} className="mt-0.5 shrink-0 text-orange" />
              )}
              {point.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
