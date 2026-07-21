import { useId } from 'react';

type FormInputProps = {
  label: string;
  error?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
  [key: string]: unknown;
};

export function FormInput({
  label,
  error,
  leftSlot,
  rightSlot,
  className,
  as: as_,
  ref,
  ...props
}: FormInputProps) {
  const generatedId = useId();
  const Tag = as_ ?? 'input';

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={generatedId}
        className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub"
      >
        {label}
      </label>
      <div className="relative">
        <Tag
          ref={ref}
          id={generatedId}
          className={[
            'w-full rounded-md border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted transition-colors focus:border-primary',
            error ? 'border-danger focus:border-danger' : 'border-border',
            leftSlot ? 'pl-16' : '',
            rightSlot ? 'pr-9' : '',
            className ?? '',
          ].join(' ')}
          {...props}
        />
        {leftSlot && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            {leftSlot}
          </div>
        )}
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
            {rightSlot}
          </div>
        )}
      </div>
      {(error as string) && (
        <span className="text-[11px] text-danger">{error as string}</span>
      )}
    </div>
  );
}
