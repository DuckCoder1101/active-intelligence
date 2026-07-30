import { useId } from 'react';

interface MoneyInputProps {
  label: string;
  error?: string;
  value: number | '';
  onChange: (value: number | '') => void;
  onBlur?: () => void;
  name?: string;
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
  name,
}: MoneyInputProps) {
  const generatedId = useId();
  const display = value === '' ? '' : currencyFormatter.format(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits ? Number(digits) / 100 : '');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={generatedId}
        className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub"
      >
        {label}
      </label>
      <input
        id={generatedId}
        name={name}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="R$ 0,00"
        className={[
          'w-full rounded-md border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted transition-colors focus:border-primary',
          error ? 'border-danger focus:border-danger' : 'border-border',
        ].join(' ')}
      />
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
