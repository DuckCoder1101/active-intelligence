export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string;
  avatarUrl?: string | null;
}
