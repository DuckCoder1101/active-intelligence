import z from 'zod';
import MembershipSchema from '../data/membership.schema';
import { UserResumeDTO } from '../../user/types/user.dtos';
import { CompanyResumeDTO } from '../../company/types/company.type';
import { Role } from '../enums/role.enum';

/** Tipo interno (repository/service) — sempre usa uid */
export interface SaveMembershipDTO {
  uid: string;
  companyId: string;
  role: Role;
}

/** Payload que o cliente envia — usa cpf para resolução */
export type SaveMemberClientDTO = z.infer<typeof MembershipSchema.saveMemberSchema>;

export type RemoveMembershipDTO = z.infer<typeof MembershipSchema.removeMemberSchema>;

export interface ListMembershipDTO {
  user: UserResumeDTO;
  company: CompanyResumeDTO;
  role: Role;
  joinedAt: number;
}
