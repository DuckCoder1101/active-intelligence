import {Timestamp} from "firebase-admin/firestore";
import {AuditAction} from "../../enums/auditAction.enum";

export interface CompanyAuditDocument {
  action: AuditAction;
  actorUid: string;
  actorName: string;
  targetUid?: string;
  taskId?: string;
  taskTitle?: string;
  details?: string;
  createdAt: Timestamp;
}
