import type { Ref } from 'react';
import { useId } from 'react';

interface MoneyInputProps {
  label?: string;
  error?: string;
  value: number | '';
  onChange: (value: number | '') => void;
  onBlur?: () => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
  /** Largura acompanha o tamanho do texto digitado, em vez de ficar fixa (uso em células compactas de tabela). */
  autoWidth?: boolean;
  ref?: Ref<HTMLInputElement>;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function MoneyInput({
  label,
  error,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  name,
  className,
  autoWidth,
  ref,
}: MoneyInputProps) {
  const generatedId = useId();
  const display = value === '' ? '' : currencyFormatter.format(value);
  // "R$ 0,00" (7 chars) + folga pra caret/borda; cresce com o texto sem cortar valores maiores.
  const widthCh = Math.max(9, (display || 'R$ 0,00').length + 2);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits ? Number(digits) / 100 : '');
  }

  const input = (
    <input
      ref={ref}
      id={label ? generatedId : undefined}
      name={name}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder="R$ 0,00"
      style={autoWidth ? { width: `${widthCh}ch` } : undefined}
      className={[
        'w-full rounded-md border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted transition-colors focus:border-primary',
        error ? 'border-danger focus:border-danger' : 'border-border',
        className ?? '',
      ].join(' ')}
    />
  );

  if (!label) {
    return input;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={generatedId}
        className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub"
      >
        {label}
      </label>
      {input}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
