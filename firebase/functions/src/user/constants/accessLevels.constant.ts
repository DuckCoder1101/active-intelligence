import { UserAccessLevel } from '@shared/types/authenticatedUser.type';

export const AccessLevels = [
  'admin',
  'client',
] as const satisfies UserAccessLevel[];
