import {
  MdPersonAdd,
  MdEdit,
  MdPersonRemove,
  MdOutlineAddTask,
  MdOutlineEditNote,
  MdOutlineSwapHoriz,
  MdOutlineDashboard,
} from 'react-icons/md';

import type { AuditLogModel, AuditAction } from '@/models/audit.model';

export interface AuditActionMeta {
  icon: React.ElementType;
  iconClass: string;
  description: (
    actor: string,
    target: string | null,
    log: AuditLogModel,
  ) => string;
}

export const AUDIT_ACTION_META: Record<AuditAction, AuditActionMeta> = {
  member_added: {
    icon: MdPersonAdd,
    iconClass: 'text-green-500 bg-green-500/10',
    description: (actor, target) =>
      `${actor} adicionou ${target ?? 'um membro'} à empresa`,
  },
  member_updated: {
    icon: MdEdit,
    iconClass: 'text-orange bg-orange/10',
    description: (actor, target) =>
      `${actor} atualizou o perfil de ${target ?? 'um membro'}`,
  },
  member_removed: {
    icon: MdPersonRemove,
    iconClass: 'text-danger bg-danger/10',
    description: (actor, target) =>
      `${actor} removeu ${target ?? 'um membro'} da empresa`,
  },
  task_created: {
    icon: MdOutlineAddTask,
    iconClass: 'text-blue-500 bg-blue-500/10',
    description: (actor, _target, log) =>
      `${actor} criou a tarefa "${log.taskTitle ?? 'sem título'}"`,
  },
  task_updated: {
    icon: MdOutlineEditNote,
    iconClass: 'text-orange bg-orange/10',
    description: (actor, _target, log) =>
      `${actor} editou a tarefa "${log.taskTitle ?? 'sem título'}"`,
  },
  task_status_changed: {
    icon: MdOutlineSwapHoriz,
    iconClass: 'text-purple-500 bg-purple-500/10',
    description: (actor, _target, log) =>
      `${actor} alterou o status de "${log.taskTitle ?? 'sem título'}"`,
  },
  task_column_moved: {
    icon: MdOutlineDashboard,
    iconClass: 'text-sky-500 bg-sky-500/10',
    description: (actor, _target, log) =>
      `${actor} moveu "${log.taskTitle ?? 'sem título'}" no kanban`,
  },
};
