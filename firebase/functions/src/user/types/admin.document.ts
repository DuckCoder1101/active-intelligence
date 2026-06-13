import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface UserDocumentWrite {
  uid: string;

  name: string;

  email: string;
  phone?: string;
  cpf: string;

  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface UserDocument {
  uid: string;

  name: string;

  email: string;
  phone?: string;
  cpf: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
