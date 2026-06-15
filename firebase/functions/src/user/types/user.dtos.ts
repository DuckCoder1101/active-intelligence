import z from 'zod';

import UserSchema from '../data/user.schema';
import { UserAccessLevel } from '@shared/types/authenticatedUser.type';

export type RegisterUserDTO = z.infer<typeof UserSchema.registerUserSchema>;

export interface UserProfileDTO {
  uid: string;

  name: string;

  email: string;
  phone?: string;
  cpf: string;

  accessLevel: UserAccessLevel;

  createdAt: number;
  updatedAt: number;
}
