import { HttpsError } from 'firebase-functions/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';

import {
  onCallHandler,
  requireAccess,
  AdminRepository,
  AuditRepository,
  AuditAction,
} from 'functions-shared';
import { TaskRepository } from '../repositories/task.repository';

const ACCESS = { minAccessLevel: 'admin' as const };

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pendente aprovação',
  approved: 'Aprovada',
  in_progress: 'Em progresso',
  completed: 'Concluída',
  rejected: 'Rejeitada',
};

const schema = z.object({
  taskId: z.string().min(1, 'taskId obrigatório'),
  approvalStatus: z.enum(['pending_approval', 'approved', 'in_progress', 'completed', 'rejected']),
});

export const updateClientTaskStatusHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError('invalid-argument', error.issues.map((i) => i.message).join(', '));
  }

  const task = await TaskRepository.getById(data.taskId);

  logger.info('updateClientTaskStatus', { taskId: data.taskId, approvalStatus: data.approvalStatus });

  const updated = await TaskRepository.updateApprovalStatus(data.taskId, data.approvalStatus);

  const actorName = await AdminRepository.getResumeByUid(caller.uid)
    .then((r) => r.name)
    .catch(() => '(admin)');

  const oldLabel = STATUS_LABELS[task.approvalStatus ?? ''] ?? task.approvalStatus ?? '—';
  const newLabel = STATUS_LABELS[data.approvalStatus];

  AuditRepository.log(task.companyId, {
    action: AuditAction.task_status_changed,
    actorUid: caller.uid,
    actorName,
    taskId: task.taskId,
    taskTitle: task.title,
    details: `${oldLabel} → ${newLabel}`,
  });

  return updated;
});
