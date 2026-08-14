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

function normalizeForTypeahead(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
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
  /**
   * Só é chamado pra Enter/Escape com o dropdown FECHADO (quando aberto, essas teclas
   * confirmam/fecham o próprio dropdown). Usado pra deixar o select se comportar como um
   * campo comum numa linha editável — Enter salva a linha, Escape cancela.
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
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
  onKeyDown: onKeyDownProp,
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeaheadRef = useRef({ buffer: '', lastTime: 0 });

  useEffect(() => {
    if (open && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const openDropdown = () => {
    const selectedIndex = options.findIndex((o) => o.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeDropdown = () => {
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleTypeahead = (e: React.KeyboardEvent<HTMLButtonElement>): boolean => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
      return false;
    }
    const now = Date.now();
    const buffer =
      now - typeaheadRef.current.lastTime > 600 ? '' : typeaheadRef.current.buffer;
    const nextBuffer = buffer + e.key;
    typeaheadRef.current = { buffer: nextBuffer, lastTime: now };
    const query = normalizeForTypeahead(nextBuffer);
    const idx = options.findIndex((o) => normalizeForTypeahead(o.label).startsWith(query));
    if (idx < 0) {
      return false;
    }
    e.preventDefault();
    setHighlightedIndex(idx);
    onChange?.(options[idx].value);
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openDropdown();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Escape') {
        // Sem dropdown aberto, essas teclas não têm papel próprio aqui — deixa o
        // container (a linha da tabela) decidir o que fazer (salvar/cancelar).
        if (onKeyDownProp) {
          e.preventDefault();
          onKeyDownProp(e);
        }
        return;
      }
      handleTypeahead(e);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        onChange?.(options[highlightedIndex].value);
      }
      closeDropdown();
      onBlur?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeDropdown();
    } else if (e.key === 'Tab') {
      closeDropdown();
    } else {
      handleTypeahead(e);
    }
  };

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
        closeDropdown();
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
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
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
            {options.map((o, i) => (
              <button
                key={o.value}
                ref={(node) => {
                  optionRefs.current[i] = node;
                }}
                type="button"
                onClick={() => {
                  onChange?.(o.value);
                  closeDropdown();
                  onBlur?.();
                  // O botão da opção some do DOM ao fechar o dropdown — sem isso,
                  // o foco cai pra <body> e quebra a sequência de Tab do formulário.
                  triggerRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`block w-full px-3 py-2 text-left text-[13px] transition-colors hover:bg-bg ${
                  o.value === value ? 'font-semibold text-orange' : 'text-text'
                } ${i === highlightedIndex ? 'bg-bg' : ''}`}
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
