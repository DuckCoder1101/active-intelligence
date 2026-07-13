import { useEffect, useRef, useState } from 'react';
import { MdAdd } from 'react-icons/md';

import { FormSelect } from '@/components/ui/form-select.component';

export interface SelectCreateOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: SelectCreateOption[];
  value: string;
  onChange: (value: string) => void;
  onCreateOption: (name: string) => Promise<string>;
  createLabel?: string;
  error?: string;
  disabled?: boolean;
}

export function SelectCreate({
  label,
  options,
  value,
  onChange,
  onCreateOption,
  createLabel = 'Adicionar novo',
  error,
  disabled,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      addInputRef.current?.focus();
    }
  }, [isAdding]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }

    setIsCreating(true);
    try {
      const createdValue = await onCreateOption(name);
      onChange(createdValue);
      setNewName('');
      setIsAdding(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FormSelect
        label={label}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(e.target.value)
        }
        disabled={disabled}
        error={error}
      >
        <option value="">Selecione...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </FormSelect>

      {!disabled &&
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
    </div>
  );
}
