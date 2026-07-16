export type AuditAction =
  | 'member_added'
  | 'member_updated'
  | 'member_removed'
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_column_moved';

export interface AuditLogModel {
  id: string;
  action: AuditAction;
  actorName: string;
  targetName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  details: string | null;
  createdAt: number;
}

export interface WorkspaceAuditLogModel extends AuditLogModel {
  companyId: string;
}
