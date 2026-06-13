import { forwardRef, useId } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
  as?: React.ElementType;
  [key: string]: unknown;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, rightSlot, className, as: Component = 'input', ...props }, ref) => {
    const generatedId = useId();

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={generatedId}
          className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub"
        >
          {label}
        </label>
        <div className="relative">
          <Component
            ref={ref}
            id={generatedId}
            className={[
              'w-full rounded-md border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted transition-colors focus:border-primary',
              error ? 'border-danger focus:border-danger' : 'border-border',
              rightSlot ? 'pr-9' : '',
              className ?? '',
            ].join(' ')}
            {...props}
          />
          {rightSlot && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
              {rightSlot}
            </div>
          )}
        </div>
        {error && (
          <span className="text-[11px] text-danger">{error}</span>
        )}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';
