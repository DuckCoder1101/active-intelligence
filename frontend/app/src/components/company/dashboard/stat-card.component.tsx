import type { ReactNode } from 'react';
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

import { Sparkline } from './sparkline.component';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: number | null;
  trendLabel?: string;
  sparklineValues?: number[];
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel = 'vs mês anterior',
  sparklineValues,
}: StatCardProps) {
  return (
    <div className="dashboard-card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-surface text-orange">
          {icon}
        </div>
        <p className="text-[12px] font-medium text-text-sub">{label}</p>
      </div>

      <div>
        <p className="text-2xl font-black tracking-tight text-text tabular-nums sm:text-[26px]">
          {value}
        </p>
        {trend !== null && trend !== undefined && (
          <p
            className={`mt-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
              trend >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {trend >= 0 ? <MdArrowUpward size={12} /> : <MdArrowDownward size={12} />}
            {Math.abs(trend)}% {trendLabel}
          </p>
        )}
      </div>

      {sparklineValues && sparklineValues.length > 1 && (
        <Sparkline values={sparklineValues} />
      )}
    </div>
  );
}
