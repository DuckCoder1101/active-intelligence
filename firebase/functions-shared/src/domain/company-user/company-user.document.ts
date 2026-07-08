import {Timestamp} from "firebase-admin/firestore";

export interface CompanyUserDocument {
  companyId: string;

  name: string;
  email: string;
  phone?: string;
  cpf: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
