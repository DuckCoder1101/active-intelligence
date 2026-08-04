import { useId } from 'react';

const SIZE = 88;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TaskQuotaCardProps {
  used: number;
  limit: number | null;
}

export function TaskQuotaCard({ used, limit }: TaskQuotaCardProps) {
  const gradientId = useId();
  const hasLimit = limit !== null && limit > 0;
  const pct = hasLimit ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <div className="dashboard-card flex items-center gap-4 p-4 sm:p-5">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-primary-glow)" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
          />
          {hasLimit && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[15px] font-black tabular-nums text-text">
          {hasLimit ? `${pct}%` : used}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[12px] font-medium text-text-sub">Tarefas do mês</p>
        <p className="mt-1 text-lg font-black tabular-nums text-text">
          {used}
          {hasLimit && <span className="text-text-muted"> / {limit}</span>}
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          {hasLimit ? 'do limite do plano' : 'tarefas solicitadas'}
        </p>
      </div>
    </div>
  );
}
