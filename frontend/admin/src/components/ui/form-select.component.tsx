import { useId } from 'react';
import { MdExpandMore } from 'react-icons/md';

type FormSelectProps = {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLSelectElement>;
  [key: string]: unknown;
};

export function FormSelect({
  label,
  error,
  children,
  className,
  ref,
  ...props
}: FormSelectProps) {
  const generatedId = useId();

  const select = (
    <div className="relative">
      <select
        ref={ref}
        id={label ? generatedId : undefined}
        className={[
          'w-full appearance-none rounded-md border bg-card py-2 pl-3 pr-8 text-sm text-text outline-none transition-colors focus:border-primary disabled:opacity-60',
          error ? 'border-danger focus:border-danger' : 'border-border',
          className ?? '',
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      <MdExpandMore
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );

  if (!label) {return select;}

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={generatedId}
        className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub"
      >
        {label}
      </label>
      {select}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
