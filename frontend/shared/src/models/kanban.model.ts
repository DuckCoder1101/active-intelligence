export interface KanbanColumn {
  columnId: string;
  name: string;
  color: string;
  order: number;
}

export interface SaveKanbanColumnDTO {
  columnId?: string;
  name: string;
  color: string;
  order?: number;
}

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
