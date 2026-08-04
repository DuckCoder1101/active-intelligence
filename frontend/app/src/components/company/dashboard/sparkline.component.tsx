import { useId } from 'react';

interface SparklineProps {
  values: number[];
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 32;

/** Decorative trend line for a stat card — no axes, no tooltip. */
export function Sparkline({ values, className = '' }: SparklineProps) {
  const fillId = useId();
  const strokeId = useId();

  if (values.length < 2) {
    return null;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = WIDTH / (values.length - 1);

  const points = values.map((v, i): [number, number] => [
    i * stepX,
    HEIGHT - ((v - min) / range) * (HEIGHT - 4) - 2,
  ]);
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={`h-8 w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary-glow)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={`url(#${strokeId})`}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
