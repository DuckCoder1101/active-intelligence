import { Timestamp } from 'firebase-admin/firestore';
import { Role } from '../enums/role.enum';

export interface MembershipDocument {
  uid: string;
  companyId: string;
  role: Role;
  joinedAt: Timestamp;
}
