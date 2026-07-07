export interface CrmColumnDTO {
  columnId: string;
  name: string;
  color: string;
  order: number;
}

export interface SaveCrmColumnDTO {
  columnId?: string;
  name: string;
  color: string;
  order?: number;
}
