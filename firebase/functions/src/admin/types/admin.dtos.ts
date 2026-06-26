export interface AdminResumeDTO {
  uid: string;
  name: string;
}

export type AdminAccessLevel = 'admin' | 'owner';

export interface AdminProfileDTO {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string;
  accessLevel: AdminAccessLevel;
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}
