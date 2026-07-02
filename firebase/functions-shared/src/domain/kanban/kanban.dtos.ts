export interface KanbanColumnDTO {
  columnId: string;
  name: string;
  color: string;
  order: number;
}

export interface SaveColumnDTO {
  columnId?: string;
  name: string;
  color: string;
  order?: number;
}
