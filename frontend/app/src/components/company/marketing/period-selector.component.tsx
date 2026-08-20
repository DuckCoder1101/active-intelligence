import type { MarketingPeriodPreset, MarketingPeriodRange } from '@/utils/marketing-insights.util';

const DAY_MS = 24 * 60 * 60 * 1000;

const PRESET_LABELS: Record<MarketingPeriodPreset, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  month: 'Este mês',
  custom: 'Personalizado',
};

const PRESETS = Object.keys(PRESET_LABELS) as MarketingPeriodPreset[];

const inputClass =
  'h-8 rounded-md border border-border bg-card px-2 text-[12px] text-text outline-none transition-colors focus:border-primary';

function toDateInputValue(ms: number): string {
  return new Date(ms).toISOString().split('T')[0];
}

function fromDateInputValue(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

interface PeriodSelectorProps {
  preset: MarketingPeriodPreset;
  customRange: MarketingPeriodRange;
  onPresetChange: (preset: MarketingPeriodPreset) => void;
  onCustomRangeChange: (range: MarketingPeriodRange) => void;
}

export function PeriodSelector({
  preset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={preset}
        onChange={(e) => onPresetChange(e.target.value as MarketingPeriodPreset)}
        className={inputClass}
      >
        {PRESETS.map((key) => (
          <option key={key} value={key}>
            {PRESET_LABELS[key]}
          </option>
        ))}
      </select>

      {preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={toDateInputValue(customRange.start)}
            onChange={(e) => {
              if (!e.target.value) return;
              onCustomRangeChange({ ...customRange, start: fromDateInputValue(e.target.value) });
            }}
            className={inputClass}
          />
          <span className="text-[11px] text-text-muted">até</span>
          <input
            type="date"
            value={toDateInputValue(customRange.end - DAY_MS)}
            onChange={(e) => {
              if (!e.target.value) return;
              onCustomRangeChange({
                ...customRange,
                end: fromDateInputValue(e.target.value) + DAY_MS,
              });
            }}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
