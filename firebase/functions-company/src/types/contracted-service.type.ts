import { Timestamp } from "firebase-admin/firestore";

export interface ContractedServiceDocument {
  name: string;
  nameIndex: string;
  createdAt: Timestamp;
}

export interface ContractedServiceDTO {
  serviceId: string;
  name: string;
}
