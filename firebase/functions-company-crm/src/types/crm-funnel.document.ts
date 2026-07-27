import { Timestamp } from "firebase-admin/firestore";

export interface CrmFunnelDocument {
  companyId: string;
  name: string;
  order: number;
  isDefault: boolean;
  createdAt: Timestamp;
}

export const DEFAULT_CRM_FUNNEL_NAME = "Funil padrão";
