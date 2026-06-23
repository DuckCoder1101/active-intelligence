import { UserAccessLevel } from '@shared/types/accessLevel.type';

export const AccessLevels = [
  'owner',
  'admin',
  'user',
] as const satisfies UserAccessLevel[];
