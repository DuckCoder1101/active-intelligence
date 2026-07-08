import {Timestamp} from "firebase-admin/firestore";

export interface AdminDocument {
  name: string;

  email: string;
  phone?: string;
  cpf: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
