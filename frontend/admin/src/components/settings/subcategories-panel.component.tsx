import { useRef, useState } from 'react';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import type { DraftCategory } from '@/utils/task-category-draft.util';

interface Props {
  category: DraftCategory;
  onAdd: (name: string) => void;
  onRemove: (key: string) => void;
  onReorder: (fromKey: string, toKey: string) => void;
}

export function SubcategoriesPanel({ category, onAdd, onRemove, onReorder }: Props) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const { subcategories } = category;

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
    onAdd(newName.trim());
    setNewName('');
    setShowAdd(false);
  };

  const requestRemove = (sub: (typeof subcategories)[number]) => {
    if (!sub.subcategoryId) {
      onRemove(sub.key);
      return;
    }
    setRemovingKey(sub.key);
  };

  const handleConfirmRemove = () => {
    if (!removingKey) {
      return;
    }
    onRemove(removingKey);
    setRemovingKey(null);
  };

  const removingSubcategory = subcategories.find((s) => s.key === removingKey);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <h2 className="text-[13px] font-bold text-text">
        Subcategorias de <span style={{ color: category.color }}>{category.name}</span>
      </h2>

      {subcategories.length === 0 && !showAdd && (
        <p className="mb-1 text-[12px] text-text-muted">
          Essa categoria ainda não tem subcategorias.
        </p>
      )}

      {subcategories.map((sub) => (
        <div
          key={sub.key}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            setDraggingKey(sub.key);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggingKey && draggingKey !== sub.key) {
              setDragOverKey(sub.key);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOverKey(null);
            }
          }}
          onDrop={() => handleDrop(sub.key)}
          onDragEnd={() => {
            setDraggingKey(null);
            setDragOverKey(null);
          }}
          className={`group flex max-w-sm cursor-grab items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-colors active:cursor-grabbing ${
            dragOverKey === sub.key
              ? 'border-orange bg-orange/10'
              : draggingKey === sub.key
                ? 'border-border/40 bg-bg/30 opacity-50'
                : 'border-border bg-card text-text-sub'
          }`}
        >
          <span className="flex-1 truncate">{sub.name}</span>
          {!sub.subcategoryId && (
            <span className="shrink-0 rounded-full bg-orange/10 px-2 py-0.5 text-[9px] font-bold uppercase text-orange">
              Novo
            </span>
          )}
          <button
            type="button"
            title="Remover subcategoria"
            onClick={() => requestRemove(sub)}
            className="shrink-0 text-text-muted/50 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
          >
            <MdDeleteOutline size={15} />
          </button>
        </div>
      ))}

      {showAdd ? (
        <div className="flex max-w-sm items-center gap-2">
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
            placeholder="Nome da subcategoria"
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="rounded-lg bg-orange px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAdd(false);
              setNewName('');
            }}
            className="rounded-lg border border-border px-3 py-2 text-[12px] text-text-sub transition-colors hover:bg-bg"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex max-w-sm items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
        >
          <MdAdd size={15} />
          Nova subcategoria
        </button>
      )}

      {removingSubcategory && (
        <ConfirmDeleteModal
          title="Remover subcategoria"
          description={`Remover "${removingSubcategory.name}"? Isso só é aplicado quando você salvar — tarefas com essa subcategoria ficarão sem subcategoria nesse momento.`}
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemovingKey(null)}
        />
      )}
    </div>
  );
}
