export type AuditAction = 'member_added' | 'member_updated' | 'member_removed';

export interface AuditLogModel {
  id: string;
  action: AuditAction;
  actorName: string;
  targetName: string | null;
  createdAt: number;
}
