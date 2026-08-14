import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import type {
  RealEstate,
  RealEstateStatus,
  SaveRealEstateDTO,
} from '@/models/real-estate.model';
import { functions, storage } from '@/utils/firebase.util';
import type {
  ImportRealEstateResult,
  ImportRealEstateRow,
} from '@/utils/real-estate-spreadsheet';

export default class RealEstateService {
  private static listCallable = httpsCallable<
    { companyId: string },
    RealEstate[]
  >(functions, 'listRealEstateHandler');

  private static saveCallable = httpsCallable<SaveRealEstateDTO, RealEstate>(
    functions,
    'saveRealEstateHandler',
  );

  private static deleteCallable = httpsCallable<
    { companyId: string; realEstateId: string },
    boolean
  >(functions, 'deleteRealEstateHandler');

  private static updateStatusCallable = httpsCallable<
    { companyId: string; realEstateId: string; status: RealEstateStatus },
    boolean
  >(functions, 'updateRealEstateStatusHandler');

  private static importCallable = httpsCallable<
    { companyId: string; rows: ImportRealEstateRow[] },
    ImportRealEstateResult
  >(functions, 'importRealEstateHandler');

  private static exportCallable = httpsCallable<
    { companyId: string },
    RealEstate[]
  >(functions, 'exportRealEstateHandler');

  static async listRealEstate(companyId: string): Promise<RealEstate[]> {
    const r = await this.listCallable({ companyId });
    return r.data;
  }

  static async saveRealEstate(data: SaveRealEstateDTO): Promise<RealEstate> {
    const r = await this.saveCallable(data);
    return r.data;
  }

  static async deleteRealEstate(
    companyId: string,
    realEstateId: string,
  ): Promise<void> {
    await this.deleteCallable({ companyId, realEstateId });
  }

  static async updateRealEstateStatus(
    companyId: string,
    realEstateId: string,
    status: RealEstateStatus,
  ): Promise<void> {
    await this.updateStatusCallable({ companyId, realEstateId, status });
  }

  static async importRealEstate(
    companyId: string,
    rows: ImportRealEstateRow[],
  ): Promise<ImportRealEstateResult> {
    const r = await this.importCallable({ companyId, rows });
    return r.data;
  }

  static async exportRealEstate(companyId: string): Promise<RealEstate[]> {
    const r = await this.exportCallable({ companyId });
    return r.data;
  }

  static async uploadImage(
    companyId: string,
    realEstateId: string,
    file: File,
  ): Promise<string> {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(
      storage,
      `client/${companyId}/real_estate/${realEstateId}/images/${filename}`,
    );
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
}
