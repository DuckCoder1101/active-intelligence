import { Timestamp } from "firebase-admin/firestore";

export interface CrmColumnDocument {
  companyId: string;
  funnelId: string;
  name: string;
  color: string;
  order: number;
  isFixed: boolean;
  createdAt: Timestamp;
}

/**
 * The 5 stages every CRM funnel always has. Seeded with these stable ids on
 * an empty funnel and enforced non-deletable in CrmColumnRepository.delete —
 * see scripts/migrate-crm-fixed-columns.js for backfilling funnels created
 * before this existed.
 */
export const DEFAULT_CRM_COLUMNS: Array<{
  id: string;
  name: string;
  color: string;
  order: number;
  isFixed: boolean;
}> = [
  { id: "leads", name: "Leads", color: "#94a3b8", order: 0, isFixed: true },
  {
    id: "qualificacao",
    name: "Qualificação",
    color: "#3b82f6",
    order: 1,
    isFixed: true,
  },
  { id: "visitas", name: "Visitas", color: "#f59e0b", order: 2, isFixed: true },
  {
    id: "propostas",
    name: "Propostas",
    color: "#f97316",
    order: 3,
    isFixed: true,
  },
  { id: "fechados", name: "Fechados", color: "#10b981", order: 4, isFixed: true },
];
