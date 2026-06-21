export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface MemberModel {
  user: { uid: string; name: string };
  role: MemberRole;
  joinedAt: number;
}
