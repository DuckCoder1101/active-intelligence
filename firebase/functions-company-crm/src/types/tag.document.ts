import { Timestamp } from 'firebase-admin/firestore';

export interface TagDocument {
  companyId: string;
  name: string;
  createdAt: Timestamp;
}
