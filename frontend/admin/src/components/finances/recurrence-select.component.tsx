import { FormSelect } from '@/components/ui/form-select.component';

export type RecurrenceMode = 'nenhuma' | 'parcelado' | 'recorrente';

export interface RecurrenceValue {
  mode: RecurrenceMode;
  /** Usado quando `mode === 'parcelado'`. */
  installmentsText: string;
  /** Usado quando `mode === 'recorrente'` — opcional, sem data o servidor assume um horizonte de 12 meses. */
  recurrenceEndDate: string;
}

export const EMPTY_RECURRENCE: RecurrenceValue = {
  mode: 'nenhuma',
  installmentsText: '',
  recurrenceEndDate: '',
};

const RECURRENCE_MODES: RecurrenceMode[] = [
  'nenhuma',
  'parcelado',
  'recorrente',
];

const RECURRENCE_MODE_LABELS: Record<RecurrenceMode, string> = {
  nenhuma: 'Nenhuma',
  parcelado: 'Parcelado',
  recorrente: 'Recorrente',
};

const compactInputClass =
  'rounded-md border border-border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary';
const fullInputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none focus:border-primary';

interface Props {
  value: RecurrenceValue;
  onChange: (value: RecurrenceValue) => void;
  /** Variante compacta (sem labels/ajuda), pra caber na linha da tabela de Lançamentos. */
  compact?: boolean;
}

export function RecurrenceSelect({ value, onChange, compact }: Props) {
  const modeSelect = (
    <FormSelect
      label={compact ? undefined : 'Recorrência'}
      className={compact ? 'w-28' : undefined}
      value={value.mode}
      onChange={(mode) => onChange({ ...value, mode: mode as RecurrenceMode })}
    >
      {RECURRENCE_MODES.map((m) => (
        <option key={m} value={m}>
          {RECURRENCE_MODE_LABELS[m]}
        </option>
      ))}
    </FormSelect>
  );

  if (value.mode === 'nenhuma') {
    return modeSelect;
  }

  if (value.mode === 'parcelado') {
    const countInput = (
      <input
        type="text"
        inputMode="numeric"
        value={value.installmentsText}
        onChange={(e) =>
          onChange({
            ...value,
            installmentsText: e.target.value.replace(/\D/g, ''),
          })
        }
        placeholder={compact ? 'Nº' : 'Número de parcelas'}
        className={compact ? `w-14 ${compactInputClass}` : fullInputClass}
      />
    );
    return compact ? (
      <div className="flex items-center gap-1">
        {modeSelect}
        {countInput}
      </div>
    ) : (
      <div className="space-y-1.5">
        {modeSelect}
        <div className="flex flex-col gap-1.5">
          <span className="form-label">Número de parcelas</span>
          {countInput}
        </div>
      </div>
    );
  }

  const endDateInput = (
    <input
      type="date"
      value={value.recurrenceEndDate}
      onChange={(e) =>
        onChange({ ...value, recurrenceEndDate: e.target.value })
      }
      className={compact ? `w-32 ${compactInputClass}` : fullInputClass}
    />
  );
  return compact ? (
    <div className="flex items-center gap-1">
      {modeSelect}
      {endDateInput}
    </div>
  ) : (
    <div className="space-y-1.5">
      {modeSelect}
      <div className="flex flex-col gap-1.5">
        <span className="form-label">Data de término (opcional)</span>
        {endDateInput}
        <p className="text-[11px] text-text-muted">
          Sem data de término, serão geradas 12 cobranças mensais. Dá pra gerar
          mais depois.
        </p>
      </div>
    </div>
  );
}
