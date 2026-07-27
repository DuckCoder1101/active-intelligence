import { useRef, useState } from 'react';
import { MdAdd, MdClose, MdDeleteOutline } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import type { CrmFunnel } from '@/models/lead.model';
import {
  useRemoveFunnelMutation,
  useReorderFunnelsMutation,
  useSaveFunnelMutation,
} from '@/queries/company-crm.queries';

interface CrmFunnelTabsProps {
  companyId: string;
  funnels: CrmFunnel[];
  activeFunnelId: string;
  onSelect: (funnelId: string) => void;
}

export function CrmFunnelTabs({
  companyId,
  funnels,
  activeFunnelId,
  onSelect,
}: CrmFunnelTabsProps) {
  const saveFunnel = useSaveFunnelMutation(companyId);
  const removeFunnel = useRemoveFunnelMutation(companyId);
  const reorderFunnels = useReorderFunnelsMutation(companyId);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(
    null,
  );

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromId = draggingId;
    setDraggingId(null);
    setDragOverId(null);
    reorderFunnels.mutate({ fromId, toId: targetId });
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      return;
    }
    saveFunnel.mutate(
      { name: newName.trim() },
      {
        onSuccess: (created) => {
          setNewName('');
          setShowAdd(false);
          onSelect(created.funnelId);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deletingFunnelId) {
      return;
    }
    const funnelName =
      funnels.find((f) => f.funnelId === deletingFunnelId)?.name ?? '';
    removeFunnel.mutate(deletingFunnelId, {
      onSuccess: ({ movedTo }) => {
        const targetName = funnels.find((f) => f.funnelId === movedTo)?.name;
        toast.success(
          movedTo
            ? `Funil "${funnelName}" excluído. Leads movidos para "${targetName}".`
            : `Funil "${funnelName}" excluído.`,
        );
        if (deletingFunnelId === activeFunnelId && movedTo) {
          onSelect(movedTo);
        }
        setDeletingFunnelId(null);
      },
    });
  };

  const deletingFunnel = funnels.find((f) => f.funnelId === deletingFunnelId);

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border px-6 py-2.5">
      {funnels.map((funnel) => {
        const isActive = funnel.funnelId === activeFunnelId;
        return (
          <div
            key={funnel.funnelId}
            draggable
            onClick={() => onSelect(funnel.funnelId)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              setDraggingId(funnel.funnelId);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggingId && draggingId !== funnel.funnelId) {
                setDragOverId(funnel.funnelId);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverId(null);
              }
            }}
            onDrop={() => handleDrop(funnel.funnelId)}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            className={`group flex shrink-0 cursor-grab items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors active:cursor-grabbing ${
              dragOverId === funnel.funnelId
                ? 'border-orange bg-orange/10'
                : isActive
                  ? 'border-orange bg-orange text-white'
                  : draggingId === funnel.funnelId
                    ? 'border-border/40 bg-bg/30 opacity-50'
                    : 'border-border bg-bg/60 text-text-muted hover:text-text'
            }`}
          >
            <span className="truncate">{funnel.name}</span>
            {!funnel.isDefault && (
              <button
                type="button"
                title="Excluir funil"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingFunnelId(funnel.funnelId);
                }}
                className={`shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                  isActive
                    ? 'text-white/70 hover:text-white'
                    : 'text-text-muted/50 hover:text-danger'
                }`}
              >
                <MdDeleteOutline size={13} />
              </button>
            )}
          </div>
        );
      })}

      {showAdd ? (
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange bg-bg/60 py-1 pl-3.5 pr-1.5">
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
            placeholder="Nome do funil"
            className="w-32 bg-transparent text-[12px] text-text outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setShowAdd(false);
              setNewName('');
            }}
            className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:text-text"
          >
            <MdClose size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
        >
          <MdAdd size={14} />
          Novo funil
        </button>
      )}

      {deletingFunnel && (
        <ConfirmDeleteModal
          title="Excluir funil"
          description={`Excluir "${deletingFunnel.name}"? As colunas desse funil serão apagadas e os leads serão movidos para outro funil.`}
          isDeleting={removeFunnel.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingFunnelId(null)}
        />
      )}
    </div>
  );
}
