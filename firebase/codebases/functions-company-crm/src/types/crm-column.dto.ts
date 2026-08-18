export interface CrmColumnDTO {
  columnId: string;
  name: string;
  color: string;
  order: number;
  isFixed: boolean;
}

export interface SaveCrmColumnDTO {
  columnId?: string;
  name: string;
  color: string;
  order?: number;
}
