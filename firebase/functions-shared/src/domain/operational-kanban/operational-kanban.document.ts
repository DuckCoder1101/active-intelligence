import { Timestamp } from "firebase-admin/firestore";

export interface OperationalKanbanColumnDocument {
  name: string;
  color: string;
  order: number;
  createdAt: Timestamp;
}

export const DEFAULT_COLUMNS: Array<{
  id: string;
  name: string;
  color: string;
  order: number;
}> = [
  { id: "requisitada", name: "Requisitada", color: "#94a3b8", order: 0 },
  { id: "em_andamento", name: "Em andamento", color: "#3b82f6", order: 1 },
  {
    id: "aguardando_cliente",
    name: "Aguardando cliente",
    color: "#f59e0b",
    order: 2,
  },
  { id: "atrasada", name: "Atrasada", color: "#ef4444", order: 3 },
  { id: "entregue", name: "Entregue", color: "#10b981", order: 4 },
];

export const PENDING_APPROVAL_COLUMN_ID = "aguardando_cliente";
export const APPROVED_COLUMN_ID = "entregue";
export const PROTECTED_COLUMN_IDS: readonly string[] = [
  PENDING_APPROVAL_COLUMN_ID,
  APPROVED_COLUMN_ID,
];
