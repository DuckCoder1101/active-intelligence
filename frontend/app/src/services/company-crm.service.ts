import { httpsCallable } from 'firebase/functions';

import type {
  CrmColumn,
  CrmOrigin,
  CrmTag,
  Lead,
  SaveLeadDTO,
} from '@/models/lead.model';
import type { UserProfile } from '@/models/user-profile.model';
import { functions } from '@/utils/firebase.util';

export default class CompanyCrmService {
  // Leads
  private static listLeadsCallable = httpsCallable<
    { companyId: string },
    Lead[]
  >(functions, 'listLeadsHandler');

  private static saveLeadCallable = httpsCallable<SaveLeadDTO, Lead>(
    functions,
    'saveLeadHandler',
  );

  private static deleteLeadCallable = httpsCallable<
    { companyId: string; leadId: string },
    boolean
  >(functions, 'deleteLeadHandler');

  private static updateLeadStatusCallable = httpsCallable<
    { companyId: string; leadId: string; status: string },
    boolean
  >(functions, 'updateLeadStatusHandler');

  static async listLeads(companyId: string): Promise<Lead[]> {
    const r = await this.listLeadsCallable({ companyId });
    return r.data;
  }

  static async saveLead(data: SaveLeadDTO): Promise<Lead> {
    const r = await this.saveLeadCallable(data);
    return r.data;
  }

  static async deleteLead(companyId: string, leadId: string): Promise<void> {
    await this.deleteLeadCallable({ companyId, leadId });
  }

  static async updateLeadStatus(
    companyId: string,
    leadId: string,
    status: string,
  ): Promise<void> {
    await this.updateLeadStatusCallable({ companyId, leadId, status });
  }

  // Tags
  private static listTagsCallable = httpsCallable<
    { companyId: string },
    CrmTag[]
  >(functions, 'listTagsHandler');

  private static saveTagCallable = httpsCallable<
    { companyId: string; name: string },
    CrmTag
  >(functions, 'saveTagHandler');

  private static deleteTagCallable = httpsCallable<
    { companyId: string; tagId: string },
    boolean
  >(functions, 'deleteTagHandler');

  static async listTags(companyId: string): Promise<CrmTag[]> {
    const r = await this.listTagsCallable({ companyId });
    return r.data;
  }

  static async saveTag(companyId: string, name: string): Promise<CrmTag> {
    const r = await this.saveTagCallable({ companyId, name });
    return r.data;
  }

  static async deleteTag(companyId: string, tagId: string): Promise<void> {
    await this.deleteTagCallable({ companyId, tagId });
  }

  // Origins
  private static listOriginsCallable = httpsCallable<
    { companyId: string },
    CrmOrigin[]
  >(functions, 'listOriginsHandler');

  private static saveOriginCallable = httpsCallable<
    { companyId: string; name: string },
    CrmOrigin
  >(functions, 'saveOriginHandler');

  private static deleteOriginCallable = httpsCallable<
    { companyId: string; originId: string },
    boolean
  >(functions, 'deleteOriginHandler');

  static async listOrigins(companyId: string): Promise<CrmOrigin[]> {
    const r = await this.listOriginsCallable({ companyId });
    return r.data;
  }

  static async saveOrigin(
    companyId: string,
    name: string,
  ): Promise<CrmOrigin> {
    const r = await this.saveOriginCallable({ companyId, name });
    return r.data;
  }

  static async deleteOrigin(companyId: string, originId: string): Promise<void> {
    await this.deleteOriginCallable({ companyId, originId });
  }

  // Kanban columns
  private static listColumnsCallable = httpsCallable<
    { companyId: string },
    CrmColumn[]
  >(functions, 'listCrmColumnsHandler');

  private static saveColumnCallable = httpsCallable<
    {
      companyId: string;
      columnId?: string;
      name: string;
      color: string;
      order?: number;
    },
    CrmColumn
  >(functions, 'saveCrmColumnHandler');

  private static deleteColumnCallable = httpsCallable<
    { companyId: string; columnId: string },
    { movedTo: string | null }
  >(functions, 'deleteCrmColumnHandler');

  static async listColumns(companyId: string): Promise<CrmColumn[]> {
    const r = await this.listColumnsCallable({ companyId });
    return r.data;
  }

  static async saveColumn(data: {
    companyId: string;
    columnId?: string;
    name: string;
    color: string;
    order?: number;
  }): Promise<CrmColumn> {
    const r = await this.saveColumnCallable(data);
    return r.data;
  }

  static async deleteColumn(
    companyId: string,
    columnId: string,
  ): Promise<{ movedTo: string | null }> {
    const r = await this.deleteColumnCallable({ companyId, columnId });
    return r.data;
  }

  // Teammates (para o campo assignedTo)
  private static listMyCompanyUsersCallable = httpsCallable<
    { companyId: string },
    UserProfile[]
  >(functions, 'listMyCompanyUsersHandler');

  static async listMyCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const r = await this.listMyCompanyUsersCallable({ companyId });
    return r.data;
  }
}
