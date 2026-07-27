import { httpsCallable } from 'firebase/functions';

import type { Guide, GuideContent, SaveGuideDTO } from '@/models/guide.model';
import { functions } from '@/utils/firebase.util';

export default class LibraryService {
  private static listGuidesCallable = httpsCallable<void, Guide[]>(
    functions,
    'listGuidesHandler',
  );

  private static getGuideCallable = httpsCallable<{ guideId: string }, Guide>(
    functions,
    'getGuideHandler',
  );

  private static saveGuideCallable = httpsCallable<SaveGuideDTO, Guide>(
    functions,
    'saveGuideHandler',
  );

  private static deleteGuideCallable = httpsCallable<
    { guideId: string },
    boolean
  >(functions, 'deleteGuideHandler');

  private static getNextGuideSequenceCallable = httpsCallable<
    void,
    { next: number }
  >(functions, 'getNextGuideSequenceHandler');

  private static getPublicGuideCallable = httpsCallable<
    { guideId: string },
    GuideContent
  >(functions, 'getPublicGuideHandler');

  static async listGuides(): Promise<Guide[]> {
    const result = await this.listGuidesCallable();
    return result.data;
  }

  static async getGuide(guideId: string): Promise<Guide> {
    const result = await this.getGuideCallable({ guideId });
    return result.data;
  }

  static async saveGuide(data: SaveGuideDTO): Promise<Guide> {
    const result = await this.saveGuideCallable(data);
    return result.data;
  }

  static async deleteGuide(guideId: string): Promise<void> {
    await this.deleteGuideCallable({ guideId });
  }

  static async getNextGuideSequence(): Promise<number> {
    const result = await this.getNextGuideSequenceCallable();
    return result.data.next;
  }

  static async getPublicGuide(guideId: string): Promise<GuideContent> {
    const result = await this.getPublicGuideCallable({ guideId });
    return result.data;
  }
}
