import { Timestamp } from 'firebase-admin/firestore';

export interface OriginDocument {
  companyId: string;
  name: string;
  createdAt: Timestamp;
}

export const DEFAULT_ORIGIN_NAMES = [
  'Meta Ads',
  'Google',
  'Indicação',
  'Site',
  'Instagram',
  'Youtube',
] as const;
