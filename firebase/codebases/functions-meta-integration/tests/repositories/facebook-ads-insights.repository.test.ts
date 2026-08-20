import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSnapshotDocGet = vi.fn();
const mockSnapshotDocSet = vi.fn();
const mockSnapshotDocDelete = vi.fn();
const mockSnapshotDocRef = {
  get: mockSnapshotDocGet,
  set: mockSnapshotDocSet,
  delete: mockSnapshotDocDelete,
};
const mockIntegrationSettingsDoc = vi.fn(() => mockSnapshotDocRef);
const mockIntegrationSettingsCollection = vi.fn(() => ({
  doc: mockIntegrationSettingsDoc,
}));

const mockDailyDoc = vi.fn((date: string) => ({ id: date }));
const mockDailyWhereGet = vi.fn();
const mockDailyOrderBy = vi.fn(() => ({ get: mockDailyWhereGet }));
const mockDailyWhere = vi.fn(() => ({
  orderBy: mockDailyOrderBy,
  get: mockDailyWhereGet,
}));
const mockDailyCollectionGet = vi.fn();
const mockDailyCollection = vi.fn(() => ({
  doc: mockDailyDoc,
  where: mockDailyWhere,
  get: mockDailyCollectionGet,
}));

const mockCompanyCollection = vi.fn((name: string) => {
  if (name === "integration_settings") return mockIntegrationSettingsCollection();
  if (name === "marketing_daily_insights") return mockDailyCollection();
  throw new Error(`unexpected sub-collection: ${name}`);
});
const mockCompanyDoc = vi.fn(() => ({ collection: mockCompanyCollection }));
const mockCompaniesCollection = { doc: mockCompanyDoc };

const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn();
const mockBatch = vi.fn(() => ({
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));

const mockDatabase = {
  collection: vi.fn((name: string) => {
    if (name === "companies") return mockCompaniesCollection;
    throw new Error(`unexpected collection: ${name}`);
  }),
  batch: mockBatch,
};

vi.mock("functions-shared", () => ({
  database: mockDatabase,
}));

const { FacebookAdsInsightsRepository } = await import(
  "../../src/repositories/facebook-ads-insights.repository"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";

describe("FacebookAdsInsightsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSnapshot", () => {
    it("devolve null quando o snapshot ainda não existe", async () => {
      mockSnapshotDocGet.mockResolvedValueOnce({ exists: false });

      const result = await FacebookAdsInsightsRepository.getSnapshot(COMPANY_ID);

      expect(result).toBeNull();
      expect(mockIntegrationSettingsDoc).toHaveBeenCalledWith("facebookAdsInsights");
    });

    it("devolve os dados quando o snapshot existe", async () => {
      const data = { companyId: COMPANY_ID, adAccountId: "act_123", currency: "BRL" };
      mockSnapshotDocGet.mockResolvedValueOnce({ exists: true, data: () => data });

      const result = await FacebookAdsInsightsRepository.getSnapshot(COMPANY_ID);

      expect(result).toEqual(data);
    });
  });

  describe("saveSnapshot", () => {
    it("grava o snapshot e limpa os campos de erro anteriores", async () => {
      await FacebookAdsInsightsRepository.saveSnapshot(COMPANY_ID, {
        adAccountId: "act_123",
        currency: "BRL",
        balance: 1500,
        campaigns: [
          {
            campaignId: "23851",
            campaignName: "Campanha Lançamento",
            status: "ACTIVE",
            effectiveStatus: "ACTIVE",
          },
        ],
      });

      expect(mockSnapshotDocSet).toHaveBeenCalledTimes(1);
      const [payload, options] = mockSnapshotDocSet.mock.calls[0];
      expect(options).toEqual({ merge: true });
      expect(payload).toMatchObject({
        companyId: COMPANY_ID,
        adAccountId: "act_123",
        currency: "BRL",
        balance: 1500,
      });
      // FieldValue.delete() é um sentinel do firebase-admin — só garantimos que os campos foram tocados.
      expect(payload).toHaveProperty("lastSyncError");
      expect(payload).toHaveProperty("lastSyncErrorCode");
    });
  });

  describe("saveSyncError", () => {
    it("só toca os campos de erro, sem mexer em campaigns/balance", async () => {
      await FacebookAdsInsightsRepository.saveSyncError(
        COMPANY_ID,
        "token_invalid",
        "Error validating access token",
      );

      expect(mockSnapshotDocSet).toHaveBeenCalledWith(
        {
          companyId: COMPANY_ID,
          lastSyncError: "Error validating access token",
          lastSyncErrorCode: "token_invalid",
          updatedAt: expect.anything(),
        },
        { merge: true },
      );
    });
  });

  describe("saveDailyInsights", () => {
    it("grava um doc por dia via batch, usando a data como id", async () => {
      await FacebookAdsInsightsRepository.saveDailyInsights(COMPANY_ID, [
        { date: "2026-08-18", campaigns: [{ campaignId: "23851", spend: 120, leads: 3 }] },
        { date: "2026-08-19", campaigns: [{ campaignId: "23851", spend: 80, leads: 1 }] },
      ]);

      expect(mockDailyDoc).toHaveBeenCalledWith("2026-08-18");
      expect(mockDailyDoc).toHaveBeenCalledWith("2026-08-19");
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it("não faz nada quando não há linhas", async () => {
      await FacebookAdsInsightsRepository.saveDailyInsights(COMPANY_ID, []);

      expect(mockBatch).not.toHaveBeenCalled();
    });
  });

  describe("getDailyInsights", () => {
    it("filtra por data >= since, ordenado ascendente", async () => {
      const rows = [{ date: "2026-08-18", campaigns: [] }];
      mockDailyWhereGet.mockResolvedValueOnce({
        docs: rows.map((r) => ({ data: () => r })),
      });

      const result = await FacebookAdsInsightsRepository.getDailyInsights(
        COMPANY_ID,
        "2026-05-21",
      );

      expect(mockDailyWhere).toHaveBeenCalledWith("date", ">=", "2026-05-21");
      expect(mockDailyOrderBy).toHaveBeenCalledWith("date", "asc");
      expect(result).toEqual(rows);
    });
  });

  describe("pruneOldDailyInsights", () => {
    it("deleta em batch os docs mais antigos que o cutoff", async () => {
      const docs = [{ ref: { id: "2026-01-01" } }, { ref: { id: "2026-01-02" } }];
      mockDailyWhereGet.mockResolvedValueOnce({ empty: false, docs });

      await FacebookAdsInsightsRepository.pruneOldDailyInsights(COMPANY_ID, "2026-05-22");

      expect(mockDailyWhere).toHaveBeenCalledWith("date", "<", "2026-05-22");
      expect(mockBatchDelete).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it("não chama batch quando não há docs antigos", async () => {
      mockDailyWhereGet.mockResolvedValueOnce({ empty: true, docs: [] });

      await FacebookAdsInsightsRepository.pruneOldDailyInsights(COMPANY_ID, "2026-05-22");

      expect(mockBatch).not.toHaveBeenCalled();
    });
  });

  describe("deleteAll", () => {
    it("apaga a série diária inteira e o snapshot", async () => {
      const docs = [{ ref: { id: "2026-01-01" } }];
      mockDailyCollectionGet.mockResolvedValueOnce({ docs });

      await FacebookAdsInsightsRepository.deleteAll(COMPANY_ID);

      expect(mockBatchDelete).toHaveBeenCalledTimes(1);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
      expect(mockSnapshotDocDelete).toHaveBeenCalledTimes(1);
    });
  });
});
