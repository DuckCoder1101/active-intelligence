import { httpsCallable } from 'firebase/functions';

import type { GuideContent } from '@/models/guide.model';
import { functions } from '@/utils/firebase.util';

export default class LibraryService {
  private static listAssignedGuidesCallable = httpsCallable<
    { companyId: string },
    GuideContent[]
  >(functions, 'listAssignedGuidesHandler');

  private static getAssignedGuideCallable = httpsCallable<
    { companyId: string; guideId: string },
    GuideContent
  >(functions, 'getAssignedGuideHandler');

  private static getPublicGuideCallable = httpsCallable<
    { guideId: string },
    GuideContent
  >(functions, 'getPublicGuideHandler');

  static async listAssignedGuides(companyId: string): Promise<GuideContent[]> {
    const result = await this.listAssignedGuidesCallable({ companyId });
    return result.data;
  }

  static async getAssignedGuide(
    companyId: string,
    guideId: string,
  ): Promise<GuideContent> {
    const result = await this.getAssignedGuideCallable({ companyId, guideId });
    return result.data;
  }

  static async getPublicGuide(guideId: string): Promise<GuideContent> {
    const result = await this.getPublicGuideCallable({ guideId });
    return result.data;
  }
}
