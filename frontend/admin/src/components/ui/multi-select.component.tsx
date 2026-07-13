import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdAdd, MdClose, MdExpandMore } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  onCreateOption?: (name: string) => Promise<string>;
  createLabel?: string;
  error?: string;
  disabled?: boolean;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  onCreateOption,
  createLabel = 'Adicionar novo',
  error,
  disabled,
}: Props) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {return;}

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (isAdding) {
      addInputRef.current?.focus();
    }
  }, [isAdding]);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeValue = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !onCreateOption) {return;}

    setIsCreating(true);
    try {
      const createdId = await onCreateOption(name);
      onChange([...selected, createdId]);
      setNewName('');
      setIsAdding(false);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={generatedId}
        className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub"
      >
        {label}
      </label>

      <button
        ref={triggerRef}
        id={generatedId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'flex min-h-9.5 w-full flex-wrap items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-left text-sm outline-none transition-colors focus:border-primary disabled:opacity-60',
          error ? 'border-danger focus:border-danger' : 'border-border',
        ].join(' ')}
      >
        {selectedOptions.length === 0 && (
          <span className="text-text-muted">Selecione...</span>
        )}
        {selectedOptions.map((o) => (
          <Badge key={o.value} variant="orange" className="gap-1 pr-1.5">
            {o.label}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                removeValue(o.value);
              }}
              className="rounded-full p-0.5 hover:bg-white/20"
            >
              <MdClose size={11} />
            </span>
          </Badge>
        ))}
        <MdExpandMore size={16} className="ml-auto shrink-0 text-text-muted" />
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
            {options.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-text-muted">
                Nenhum serviço cadastrado ainda.
              </p>
            )}
            {options.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] text-text hover:bg-bg"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggleValue(o.value)}
                  className="accent-orange"
                />
                {o.label}
              </label>
            ))}
          </div>,
          document.body,
        )}

      {onCreateOption &&
        (isAdding ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={addInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleCreate();
                }
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewName('');
                }
              }}
              placeholder={createLabel}
              className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={!newName.trim() || isCreating}
              onClick={() => void handleCreate()}
              className="shrink-0 rounded-md bg-orange px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewName('');
              }}
              className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:bg-bg"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex w-fit items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:border-orange hover:text-orange"
          >
            <MdAdd size={14} />
            {createLabel}
          </button>
        ))}

      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
