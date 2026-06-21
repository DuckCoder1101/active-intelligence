import { Timestamp } from 'firebase-admin/firestore';

export interface UserDocument {
  name: string;

  email: string;
  phone?: string;
  cpf: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
