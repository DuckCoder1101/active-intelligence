import { useMemo, useRef, useState } from 'react';
import { MdAdd, MdCheck, MdDeleteOutline } from 'react-icons/md';
import { toast } from 'react-toastify';

import { LeadCard } from '@/components/company/crm/lead-card.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import {
  CRM_COLUMN_COLOR_PRESETS,
  DEAL_STATUS_LABELS,
  DEAL_STATUSES,
} from '@/models/lead.model';
import type { CrmColumn, CrmTag, DealStatus, Lead } from '@/models/lead.model';
import {
  useAddCrmColumnMutation,
  useRemoveCrmColumnMutation,
  useReorderCrmColumnsMutation,
  useUpdateLeadStatusMutation,
} from '@/queries/company-crm.queries';

interface CrmBoardProps {
  companyId: string;
  leads: Lead[];
  columns: CrmColumn[];
  tags: CrmTag[];
  onLeadClick: (lead: Lead) => void;
  onNewLead: () => void;
}

export function CrmBoard({
  companyId,
  leads,
  columns,
  tags,
  onLeadClick,
  onNewLead,
}: CrmBoardProps) {
  const updateStatus = useUpdateLeadStatusMutation(companyId);
  const reorderColumns = useReorderCrmColumnsMutation(companyId);
  const addColumn = useAddCrmColumnMutation(companyId);
  const removeColumn = useRemoveCrmColumnMutation(companyId);

  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const [draggingColId, setDraggingColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState<string>(
    CRM_COLUMN_COLOR_PRESETS[0].value,
  );
  const newColInputRef = useRef<HTMLInputElement>(null);

  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  const [dealStatusFilter, setDealStatusFilter] = useState<
    DealStatus | 'todos'
  >('aberto');

  const visibleLeads = useMemo(
    () =>
      dealStatusFilter === 'todos'
        ? leads
        : leads.filter((lead) => lead.dealStatus === dealStatusFilter),
    [leads, dealStatusFilter],
  );

  const leadsByColumn = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const col of columns) {
      map[col.columnId] = [];
    }
    for (const lead of visibleLeads) {
      if (lead.status in map) {
        map[lead.status].push(lead);
      } else if (columns.length > 0) {
        map[columns[0].columnId].push(lead);
      }
    }
    return map;
  }, [columns, visibleLeads]);

  const handleDrop = (columnId: string) => {
    if (!draggingLeadId) {
      return;
    }
    const lead = leads.find((l) => l.leadId === draggingLeadId);
    setDraggingLeadId(null);
    setDragOverColumnId(null);
    if (!lead || lead.status === columnId) {
      return;
    }
    updateStatus.mutate({ leadId: lead.leadId, status: columnId });
  };

  const handleColumnDrop = (targetColId: string) => {
    if (!draggingColId || draggingColId === targetColId) {
      setDraggingColId(null);
      setDragOverColId(null);
      return;
    }
    const from = draggingColId;
    setDraggingColId(null);
    setDragOverColId(null);
    reorderColumns.mutate({ fromId: from, toId: targetColId });
  };

  const handleSaveColumn = () => {
    if (!newColName.trim()) {
      return;
    }
    addColumn.mutate(
      { name: newColName.trim(), color: newColColor },
      {
        onSuccess: () => {
          setNewColName('');
          setNewColColor(CRM_COLUMN_COLOR_PRESETS[0].value);
          setShowAddCol(false);
        },
      },
    );
  };

  const handleDeleteColumn = () => {
    if (!deletingColumnId) {
      return;
    }
    const colName =
      columns.find((c) => c.columnId === deletingColumnId)?.name ?? '';
    removeColumn.mutate(deletingColumnId, {
      onSuccess: ({ movedTo }) => {
        const targetName = columns.find((c) => c.columnId === movedTo)?.name;
        toast.success(
          movedTo
            ? `Quadro "${colName}" excluído. Leads movidos para "${targetName}".`
            : `Quadro "${colName}" excluído.`,
        );
        setDeletingColumnId(null);
      },
    });
  };

  const deletingColumn = columns.find((c) => c.columnId === deletingColumnId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h1 className="text-[18px] font-bold text-text sm:text-[20px]">CRM</h1>
        <div className="flex items-center gap-1 rounded-full border border-border bg-bg/60 p-1">
          {([...DEAL_STATUSES, 'todos'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDealStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                dealStatusFilter === value
                  ? 'bg-orange text-white'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {value === 'todos' ? 'Todos' : DEAL_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNewLead}
          className="btn-primary shrink-0 px-4"
        >
          <MdAdd size={16} />
          Novo lead
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex h-full gap-4 overflow-x-auto px-6 py-5">
          {columns.map((col) => {
            const colLeads = leadsByColumn[col.columnId] ?? [];
            const isDragOver = dragOverColumnId === col.columnId;

            return (
              <div
                key={col.columnId}
                className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-bg/30 p-2"
                onDragOver={(e) => {
                  if (draggingColId) {
                    return;
                  }
                  e.preventDefault();
                  setDragOverColumnId(col.columnId);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumnId(null);
                  }
                }}
                onDrop={() => {
                  if (draggingColId) {
                    return;
                  }
                  handleDrop(col.columnId);
                }}
                onDragEnd={() => {
                  setDraggingColId(null);
                  setDragOverColId(null);
                  setDraggingLeadId(null);
                  setDragOverColumnId(null);
                }}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingColId(col.columnId);
                    setDraggingLeadId(null);
                    setDragOverColumnId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggingColId && draggingColId !== col.columnId) {
                      setDragOverColId(col.columnId);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverColId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleColumnDrop(col.columnId);
                  }}
                  onDragEnd={() => {
                    setDraggingColId(null);
                    setDragOverColId(null);
                  }}
                  className={`mb-2.5 flex shrink-0 cursor-grab items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors active:cursor-grabbing ${
                    dragOverColId === col.columnId
                      ? 'border-orange bg-orange/10'
                      : draggingColId === col.columnId
                        ? 'border-border/40 bg-bg/30 opacity-50'
                        : isDragOver
                          ? 'border-orange/40 bg-orange/5'
                          : 'border-border bg-bg/60'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="flex-1 truncate text-[12px] font-bold text-text">
                    {col.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-muted">
                    {colLeads.length}
                  </span>
                  <button
                    type="button"
                    title="Excluir quadro"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingColumnId(col.columnId);
                    }}
                    className="shrink-0 text-text-muted/50 transition-colors hover:text-danger"
                  >
                    <MdDeleteOutline size={14} />
                  </button>
                </div>

                <div
                  className={`flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-1 transition-colors ${
                    isDragOver ? 'bg-orange/5 ring-1 ring-orange/20' : ''
                  }`}
                >
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.leadId}
                      lead={lead}
                      tags={tags}
                      onClick={() => onLeadClick(lead)}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingLeadId(lead.leadId);
                      }}
                    />
                  ))}
                  {colLeads.length === 0 && !isDragOver && (
                    <div className="flex min-h-30 items-center justify-center rounded-xl border border-dashed border-border/40">
                      <p className="text-[11px] text-text-muted/50">
                        Sem leads
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex w-64 shrink-0 flex-col">
            {showAddCol ? (
              <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                <p className="mb-3 text-[12px] font-bold text-text">
                  Novo quadro
                </p>
                <input
                  ref={newColInputRef}
                  type="text"
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveColumn();
                    }
                    if (e.key === 'Escape') {
                      setShowAddCol(false);
                      setNewColName('');
                    }
                  }}
                  placeholder="Nome do quadro"
                  className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
                />
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <input
                    type="color"
                    title="Escolher cor"
                    value={newColColor}
                    onChange={(e) => setNewColColor(e.target.value)}
                    className="h-6 w-6 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                  />
                  {CRM_COLUMN_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.label}
                      onClick={() => setNewColColor(preset.value)}
                      className="relative h-5 w-5 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: preset.value }}
                    >
                      {newColColor === preset.value && (
                        <MdCheck
                          size={12}
                          className="absolute inset-0 m-auto text-white"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCol(false);
                      setNewColName('');
                    }}
                    className="flex-1 rounded-lg border border-border py-1.5 text-[12px] text-text-sub transition-colors hover:bg-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveColumn}
                    disabled={!newColName.trim() || addColumn.isPending}
                    className="flex-1 rounded-lg bg-orange py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Criar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddCol(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
              >
                <MdAdd size={15} />
                Novo quadro
              </button>
            )}
          </div>
        </div>
      </div>

      {deletingColumn && (
        <ConfirmDeleteModal
          title="Excluir quadro"
          description={`Excluir "${deletingColumn.name}"? Os leads serão movidos para outro quadro.`}
          isDeleting={removeColumn.isPending}
          onConfirm={handleDeleteColumn}
          onCancel={() => setDeletingColumnId(null)}
        />
      )}
    </div>
  );
}
