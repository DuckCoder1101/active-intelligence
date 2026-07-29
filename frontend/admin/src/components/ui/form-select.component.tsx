import type { ReactNode, Ref } from 'react';
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { MdExpandMore } from 'react-icons/md';

interface FormSelectOption {
  value: string;
  label: string;
}

function extractOptions(children: ReactNode): FormSelectOption[] {
  return Children.toArray(children)
    .filter(
      (
        child,
      ): child is React.ReactElement<{
        value?: string | number;
        children?: ReactNode;
      }> => isValidElement(child) && child.type === 'option',
    )
    .map((child) => {
      const value = String(child.props.value ?? '');
      const label =
        typeof child.props.children === 'string' ? child.props.children : value;
      return { value, label };
    });
}

interface FormSelectProps {
  label?: string;
  error?: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function FormSelect({
  label,
  error,
  value,
  onChange,
  onBlur,
  disabled,
  className,
  placeholder = 'Selecione...',
  children,
  ref,
}: FormSelectProps) {
  const generatedId = useId();
  const options = extractOptions(children);
  const selected = options.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onBlur]);

  const select = (
    <div className="relative">
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        id={label ? generatedId : undefined}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'flex h-9.5 w-full items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-left text-sm outline-none transition-colors focus:border-primary disabled:opacity-60',
          error ? 'border-danger focus:border-danger' : 'border-border',
          className ?? '',
        ].join(' ')}
      >
        <span
          className={`min-w-0 flex-1 truncate ${selected ? 'text-text' : 'text-text-muted'}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <MdExpandMore size={16} className="shrink-0 text-text-muted" />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-50 max-h-56 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange?.(o.value);
                  setOpen(false);
                  onBlur?.();
                }}
                className={`block w-full px-3 py-2 text-left text-[13px] transition-colors hover:bg-bg ${
                  o.value === value ? 'font-semibold text-orange' : 'text-text'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );

  if (!label) {
    return select;
  }

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
