export interface CrmFunnelDTO {
  funnelId: string;
  name: string;
  order: number;
  isDefault: boolean;
}

export interface SaveCrmFunnelDTO {
  funnelId?: string;
  name: string;
  order?: number;
}
