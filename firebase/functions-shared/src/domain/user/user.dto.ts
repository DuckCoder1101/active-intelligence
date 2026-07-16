import { z } from "zod";
import UserSchema from "./user.schema";

export interface UserProfileDTO {
  uid: string;

  name: string;
  email: string;
  phone?: string;
  cpf: string;

  createdAt: number;
  updatedAt: number;
}

export type CompleteProfileDTO = z.infer<
  typeof UserSchema.completeProfileSchema
>;
export type UpdateProfileDTO = z.infer<typeof UserSchema.updateProfileSchema>;
export type DeleteAccountDTO = z.infer<typeof UserSchema.deleteAccountSchema>;
