import z from 'zod';
import UserSchema from '../user/user.schema';
import { UserProfileDTO } from '../user/user.dto';

export type InviteCompanyUserDTO = z.infer<typeof UserSchema.inviteUserSchema>;

export interface CompanyUserListDTO extends UserProfileDTO {
  companyId: string;
}
