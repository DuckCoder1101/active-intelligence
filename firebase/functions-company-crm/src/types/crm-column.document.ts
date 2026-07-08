import {Timestamp} from "firebase-admin/firestore";

export interface CrmColumnDocument {
  companyId: string;
  name: string;
  color: string;
  order: number;
  createdAt: Timestamp;
}

export const DEFAULT_CRM_COLUMNS: Array<{
  id: string;
  name: string;
  color: string;
  order: number;
}> = [
  {id: "novo", name: "Novo", color: "#94a3b8", order: 0},
  {id: "contatado", name: "Contatado", color: "#3b82f6", order: 1},
  {id: "qualificado", name: "Qualificado", color: "#8b5cf6", order: 2},
  {id: "visita_agendada", name: "Visita agendada", color: "#f59e0b", order: 3},
  {id: "proposta", name: "Proposta", color: "#f97316", order: 4},
  {id: "fechado", name: "Fechado", color: "#10b981", order: 5},
  {id: "perdido", name: "Perdido", color: "#ef4444", order: 6},
];
