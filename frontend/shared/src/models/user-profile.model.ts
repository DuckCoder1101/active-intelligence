export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
}
