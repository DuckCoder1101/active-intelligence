export interface AdminTasksBoardColumnDTO {
  columnId: string;
  name: string;
  color: string;
  order: number;
}

export interface SaveAdminTasksBoardColumnDTO {
  columnId?: string;
  name: string;
  color: string;
  order?: number;
}
