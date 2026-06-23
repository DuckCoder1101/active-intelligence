import type { UserAccessLevel } from '@/models/user.model';

const LABELS: Record<UserAccessLevel, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  user: 'Usuário',
};

export function formatAccessLevel(level: UserAccessLevel): string {
  return LABELS[level] ?? 'Usuário';
}
