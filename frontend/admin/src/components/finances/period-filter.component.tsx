import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

import { fromDateInput, fromMonthInput, toDateInput, toMonthInput } from '@/utils/date.util';

export type PeriodGranularity = 'dia' | 'mes' | 'ano';

export interface PeriodValue {
  granularity: PeriodGranularity;
  /** Qualquer instante dentro do período — dia/mês/ano são derivados dele. */
  anchor: number;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function startOfMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function startOfYear(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), 0, 1).getTime();
}

export function currentMonthPeriod(): PeriodValue {
  return { granularity: 'mes', anchor: startOfMonth(Date.now()) };
}

/** Intervalo [start, end) em ms correspondente ao período. */
export function getPeriodRange(value: PeriodValue): { start: number; end: number } {
  const d = new Date(value.anchor);
  if (value.granularity === 'dia') {
    return {
      start: startOfDay(value.anchor),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(),
    };
  }
  if (value.granularity === 'ano') {
    return {
      start: startOfYear(value.anchor),
      end: new Date(d.getFullYear() + 1, 0, 1).getTime(),
    };
  }
  return {
    start: startOfMonth(value.anchor),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
  };
}

export function isWithinPeriod(dateMs: number, value: PeriodValue): boolean {
  const { start, end } = getPeriodRange(value);
  return dateMs >= start && dateMs < end;
}

export function shiftPeriod(value: PeriodValue, direction: 1 | -1): PeriodValue {
  const d = new Date(value.anchor);
  if (value.granularity === 'dia') {
    return {
      ...value,
      anchor: new Date(d.getFullYear(), d.getMonth(), d.getDate() + direction).getTime(),
    };
  }
  if (value.granularity === 'ano') {
    return { ...value, anchor: new Date(d.getFullYear() + direction, 0, 1).getTime() };
  }
  return {
    ...value,
    anchor: new Date(d.getFullYear(), d.getMonth() + direction, 1).getTime(),
  };
}

const GRANULARITY_LABELS: Record<PeriodGranularity, string> = {
  dia: 'Dia',
  mes: 'Mês',
  ano: 'Ano',
};

const GRANULARITIES: PeriodGranularity[] = ['dia', 'mes', 'ano'];

const navBtnClass =
  'flex h-9.5 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-text-muted transition-colors hover:text-text';
const jumpInputClass =
  'h-9.5 rounded-md border border-border bg-card px-2 text-sm text-text outline-none transition-colors focus:border-primary';

interface Props {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="form-label">Período</span>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5 rounded-md border border-border bg-card p-0.5">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...value, granularity: g })}
              className={`rounded px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                value.granularity === g
                  ? 'bg-orange text-white'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {GRANULARITY_LABELS[g]}
            </button>
          ))}
        </div>

        <button
          type="button"
          title="Período anterior"
          onClick={() => onChange(shiftPeriod(value, -1))}
          className={navBtnClass}
        >
          <MdChevronLeft size={18} />
        </button>

        {value.granularity === 'dia' && (
          <input
            type="date"
            value={toDateInput(value.anchor)}
            onChange={(e) =>
              e.target.value && onChange({ ...value, anchor: fromDateInput(e.target.value) })
            }
            className={jumpInputClass}
          />
        )}

        {value.granularity === 'mes' && (
          <input
            type="month"
            value={toMonthInput(value.anchor)}
            onChange={(e) =>
              e.target.value && onChange({ ...value, anchor: fromMonthInput(e.target.value) })
            }
            className={jumpInputClass}
          />
        )}

        {value.granularity === 'ano' && (
          <input
            type="number"
            value={new Date(value.anchor).getFullYear()}
            onChange={(e) => {
              const year = Number(e.target.value);
              if (year >= 1900 && year <= 2200) {
                onChange({ ...value, anchor: new Date(year, 0, 1).getTime() });
              }
            }}
            className={`${jumpInputClass} w-20`}
          />
        )}

        <button
          type="button"
          title="Próximo período"
          onClick={() => onChange(shiftPeriod(value, 1))}
          className={navBtnClass}
        >
          <MdChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
