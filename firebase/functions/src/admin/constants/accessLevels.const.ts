import { AdminAccessLevel } from '@shared/types/accessLevel.type';

export const AdminAccessLevels = [
  'owner',
  'admin',
] as const satisfies AdminAccessLevel[];
