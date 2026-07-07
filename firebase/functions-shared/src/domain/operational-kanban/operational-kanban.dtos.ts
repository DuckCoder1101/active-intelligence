export interface OperationalKanbanColumnDTO {
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
