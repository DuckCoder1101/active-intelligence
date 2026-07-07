export interface OperationalKanbanColumn {
  columnId: string;
  name: string;
  color: string;
  order: number;
}

export interface SaveOperationalKanbanColumnDTO {
  columnId?: string;
  name: string;
  color: string;
  order?: number;
}

// Espelha firebase/functions-shared/src/domain/operational-kanban/operational-kanban.document.ts —
// colunas fixas usadas pelo fluxo de aprovação do cliente.
export const PENDING_APPROVAL_COLUMN_ID = 'aguardando_cliente';
export const APPROVED_COLUMN_ID = 'entregue';

export const COLUMN_COLOR_PRESETS = [
  { label: 'Cinza', value: '#94a3b8' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Violeta', value: '#8b5cf6' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Verde', value: '#10b981' },
  { label: 'Teal', value: '#14b8a6' },
] as const;
