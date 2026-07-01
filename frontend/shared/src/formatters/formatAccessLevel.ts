import type { UserAccessLevel } from '@/types/access-level.type';

const LABELS: Record<UserAccessLevel, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  user: 'Usuário',
};

export function formatAccessLevel(level: string): string {
  return (LABELS as Record<string, string>)[level] ?? level;
}
