import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdAdd, MdCheck, MdExpandMore } from 'react-icons/md';

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface ColorPreset {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  onCreateOption?: (name: string, color?: string) => Promise<string>;
  createLabel?: string;
  error?: string;
  disabled?: boolean;
  colorPresets?: readonly ColorPreset[];
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
  colorPresets,
}: Props) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(
    colorPresets?.[0]?.value ?? '#94a3b8',
  );
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

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !onCreateOption) {
      return;
    }

    setIsCreating(true);
    try {
      const createdId = await onCreateOption(
        name,
        colorPresets ? newColor : undefined,
      );
      onChange([...selected, createdId]);
      setNewName('');
      setNewColor(colorPresets?.[0]?.value ?? '#94a3b8');
      setIsAdding(false);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));
  const summary =
    selectedOptions.length === 0
      ? 'Selecione...'
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selecionados`;

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
          'flex h-9.5 w-full items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-left text-sm outline-none transition-colors focus:border-primary disabled:opacity-60',
          error ? 'border-danger focus:border-danger' : 'border-border',
        ].join(' ')}
      >
        {selectedOptions.length === 1 && selectedOptions[0].color && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: selectedOptions[0].color }}
          />
        )}
        <span
          className={`min-w-0 flex-1 truncate ${selectedOptions.length === 0 ? 'text-text-muted' : 'text-text'}`}
        >
          {summary}
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
                {o.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: o.color }}
                  />
                )}
                {o.label}
              </label>
            ))}
          </div>,
          document.body,
        )}

      {onCreateOption &&
        (isAdding ? (
          <div className="space-y-2">
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
            {colorPresets && (
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="color"
                  title="Escolher cor"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-5 w-5 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                />
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setNewColor(preset.value)}
                    className="relative h-4 w-4 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: preset.value }}
                  >
                    {newColor === preset.value && (
                      <MdCheck
                        size={10}
                        className="absolute inset-0 m-auto text-white"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
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
