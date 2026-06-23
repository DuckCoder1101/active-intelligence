import z from 'zod';

import UserSchema from '../data/user.schema';
import {
  AdminPermission,
  UserAccessLevel,
} from '@shared/types/accessLevel.type';

export type RegisterUserDTO = z.infer<typeof UserSchema.registerUserSchema>;
export type UpdateUserDTO = z.infer<typeof UserSchema.updateUserSchema>;

export interface UserProfileDTO {
  uid: string;

  name: string;

  email: string;
  phone?: string;
  cpf: string;

  accessLevel: UserAccessLevel;
  permissions: AdminPermission[];

  createdAt: number;
  updatedAt: number;
}

export interface UserResumeDTO {
  uid: string;
  name: string;
}
