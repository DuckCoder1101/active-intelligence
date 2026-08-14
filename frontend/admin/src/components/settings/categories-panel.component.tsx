import { useRef, useState } from 'react';
import { MdAdd, MdCheck, MdDeleteOutline } from 'react-icons/md';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { COLUMN_COLOR_PRESETS } from '@/models/admin-tasks-board.model';
import type { DraftCategory } from '@/utils/task-category-draft.util';

interface Props {
  categories: DraftCategory[];
  selectedKey: string | undefined;
  onSelect: (key: string) => void;
  onReorder: (fromKey: string, toKey: string) => void;
  onAdd: (name: string, color: string) => void;
  onRemove: (key: string) => void;
}

export function CategoriesPanel({
  categories,
  selectedKey,
  onSelect,
  onReorder,
  onAdd,
  onRemove,
}: Props) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(COLUMN_COLOR_PRESETS[0].value);
  const newInputRef = useRef<HTMLInputElement>(null);

  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const handleDrop = (targetKey: string) => {
    if (!draggingKey || draggingKey === targetKey) {
      setDraggingKey(null);
      setDragOverKey(null);
      return;
    }
    onReorder(draggingKey, targetKey);
    setDraggingKey(null);
    setDragOverKey(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      return;
    }
    onAdd(newName.trim(), newColor);
    setNewName('');
    setNewColor(COLUMN_COLOR_PRESETS[0].value);
    setShowAdd(false);
  };

  const requestRemove = (category: DraftCategory) => {
    // Categoria ainda não salva: pode sumir da lista direto, não há nada a
    // perder. Categoria existente: confirma, já que ao salvar isso apaga de
    // verdade e move as tarefas.
    if (!category.categoryId) {
      onRemove(category.key);
      return;
    }
    setRemovingKey(category.key);
  };

  const handleConfirmRemove = () => {
    if (!removingKey) {
      return;
    }
    onRemove(removingKey);
    setRemovingKey(null);
  };

  const removingCategory = categories.find((c) => c.key === removingKey);

  return (
    <div className="flex w-full max-w-sm shrink-0 flex-col gap-2">
      <h2 className="text-[13px] font-bold text-text">Categorias</h2>

      {categories.map((category) => {
        const isSelected = category.key === selectedKey;
        return (
          <div
            key={category.key}
            draggable
            onClick={() => onSelect(category.key)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              setDraggingKey(category.key);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggingKey && draggingKey !== category.key) {
                setDragOverKey(category.key);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverKey(null);
              }
            }}
            onDrop={() => handleDrop(category.key)}
            onDragEnd={() => {
              setDraggingKey(null);
              setDragOverKey(null);
            }}
            className={`group flex cursor-grab items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition-colors active:cursor-grabbing ${
              dragOverKey === category.key
                ? 'border-orange bg-orange/10'
                : isSelected
                  ? 'border-orange bg-orange/10 text-text'
                  : draggingKey === category.key
                    ? 'border-border/40 bg-bg/30 opacity-50'
                    : 'border-border bg-card text-text-sub hover:text-text'
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="flex-1 truncate">{category.name}</span>
            {!category.categoryId && (
              <span className="shrink-0 rounded-full bg-orange/10 px-2 py-0.5 text-[9px] font-bold uppercase text-orange">
                Novo
              </span>
            )}
            <span className="shrink-0 rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-muted">
              {category.subcategories.length}
            </span>
            <button
              type="button"
              title="Remover categoria"
              onClick={(e) => {
                e.stopPropagation();
                requestRemove(category);
              }}
              className="shrink-0 text-text-muted/50 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            >
              <MdDeleteOutline size={15} />
            </button>
          </div>
        );
      })}

      {showAdd ? (
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <input
            ref={newInputRef}
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
              if (e.key === 'Escape') {
                setShowAdd(false);
                setNewName('');
              }
            }}
            placeholder="Nome da categoria"
            className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
          />
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <input
              type="color"
              title="Escolher cor"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-6 w-6 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
            />
            {COLUMN_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                onClick={() => setNewColor(preset.value)}
                className="relative h-5 w-5 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: preset.value }}
              >
                {newColor === preset.value && (
                  <MdCheck size={12} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewName('');
              }}
              className="flex-1 rounded-lg border border-border py-1.5 text-[12px] text-text-sub transition-colors hover:bg-bg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 rounded-lg bg-orange py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Adicionar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
        >
          <MdAdd size={15} />
          Nova categoria
        </button>
      )}

      {removingCategory && (
        <ConfirmDeleteModal
          title="Remover categoria"
          description={`Remover "${removingCategory.name}"? Isso só é aplicado quando você salvar — nesse momento as subcategorias são apagadas e as tarefas são movidas para outra categoria.`}
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemovingKey(null)}
        />
      )}
    </div>
  );
}
