import { Timestamp } from 'firebase-admin/firestore';
import { AuditAction } from '../../shared/enums/auditAction.enum';

export interface CompanyAuditDocument {
  action: AuditAction;
  actorUid: string;
  targetUid?: string;
  createdAt: Timestamp;
}
