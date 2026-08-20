import { beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";

const mockDocGet = vi.fn();
const mockDocSet = vi.fn();
const mockCompanyIntegrationDoc = vi.fn(() => ({
  get: mockDocGet,
  set: mockDocSet,
}));
const mockIntegrationSettingsCollection = vi.fn(() => ({
  doc: mockCompanyIntegrationDoc,
}));
const mockCompanyDoc = vi.fn(() => ({
  collection: mockIntegrationSettingsCollection,
}));
const mockCompaniesCollection = { doc: mockCompanyDoc };

const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockBatch = vi.fn(() => ({ set: mockBatchSet, commit: mockBatchCommit }));

const mockPageLinkDoc = vi.fn((pageId: string) => ({ id: pageId }));
const mockFacebookPageLinksCollection = { doc: mockPageLinkDoc };

const mockDatabase = {
  collection: vi.fn((name: string) => {
    if (name === "companies") return mockCompaniesCollection;
    if (name === "facebook_page_links") return mockFacebookPageLinksCollection;
    throw new Error(`unexpected collection: ${name}`);
  }),
  batch: mockBatch,
};

vi.mock("functions-shared", () => ({
  database: mockDatabase,
}));

const { FacebookAdsIntegrationRepository } = await import(
  "../../src/repositories/facebook-ads-integration.repository"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";
const UID = "uid-a8f3c1d2e5b6";

describe("FacebookAdsIntegrationRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("devolve null quando a empresa ainda não conectou o Facebook Ads", async () => {
      mockDocGet.mockResolvedValueOnce({ exists: false });

      const result = await FacebookAdsIntegrationRepository.get(COMPANY_ID);

      expect(result).toBeNull();
      expect(mockCompanyDoc).toHaveBeenCalledWith(COMPANY_ID);
      expect(mockIntegrationSettingsCollection).toHaveBeenCalledWith(
        "integration_settings",
      );
      expect(mockCompanyIntegrationDoc).toHaveBeenCalledWith("facebookAds");
    });

    it("converte os timestamps do Firestore para epoch ms", async () => {
      const connectedAt = Timestamp.fromMillis(1755043200000);
      const updatedAt = Timestamp.fromMillis(1755129600000);

      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          companyId: COMPANY_ID,
          connected: true,
          fbUserId: "10159876543210987",
          fbUserName: "Ana Paula Ferreira",
          secretRef: `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
          pages: [
            {
              pageId: "102934857612345",
              pageName: "Imobiliária Vista Alegre",
              subscribed: false,
              forms: [],
            },
          ],
          connectedBy: UID,
          connectedAt,
          updatedAt,
        }),
      });

      const result = await FacebookAdsIntegrationRepository.get(COMPANY_ID);

      expect(result).toEqual({
        connected: true,
        fbUserId: "10159876543210987",
        fbUserName: "Ana Paula Ferreira",
        pages: [
          {
            pageId: "102934857612345",
            pageName: "Imobiliária Vista Alegre",
            subscribed: false,
            forms: [],
          },
        ],
        adAccounts: [],
        selectedAdAccountId: null,
        adAccountsFetchFailed: false,
        connectedBy: UID,
        connectedAt: connectedAt.toMillis(),
        updatedAt: updatedAt.toMillis(),
      });
    });
  });

  describe("save", () => {
    it("grava o documento de integração e os facebook_page_links de cada página", async () => {
      const savedAt = Timestamp.fromMillis(1755043200000);
      mockDocSet.mockResolvedValueOnce(undefined);
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          companyId: COMPANY_ID,
          connected: true,
          fbUserId: "10159876543210987",
          fbUserName: "Ana Paula Ferreira",
          secretRef: `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
          pages: [
            {
              pageId: "102934857612345",
              pageName: "Imobiliária Vista Alegre",
              subscribed: false,
              forms: [],
            },
            {
              pageId: "108273645910238",
              pageName: "Vista Alegre Empreendimentos",
              subscribed: false,
              forms: [],
            },
          ],
          connectedBy: UID,
          connectedAt: savedAt,
          updatedAt: savedAt,
        }),
      });

      const result = await FacebookAdsIntegrationRepository.save(
        COMPANY_ID,
        UID,
        {
          fbUserId: "10159876543210987",
          fbUserName: "Ana Paula Ferreira",
          secretRef: `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
          pages: [
            {
              pageId: "102934857612345",
              pageName: "Imobiliária Vista Alegre",
              subscribed: false,
              forms: [],
            },
            {
              pageId: "108273645910238",
              pageName: "Vista Alegre Empreendimentos",
              subscribed: false,
              forms: [],
            },
          ],
        },
      );

      expect(mockDocSet).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: COMPANY_ID,
          connected: true,
          fbUserId: "10159876543210987",
          fbUserName: "Ana Paula Ferreira",
          connectedBy: UID,
        }),
        { merge: true },
      );

      expect(mockBatch).toHaveBeenCalledTimes(1);
      expect(mockPageLinkDoc).toHaveBeenCalledWith("102934857612345");
      expect(mockPageLinkDoc).toHaveBeenCalledWith("108273645910238");
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
      expect(mockBatchSet).toHaveBeenCalledWith(expect.anything(), {
        companyId: COMPANY_ID,
      });
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);

      expect(result.fbUserName).toBe("Ana Paula Ferreira");
      expect(result.pages).toHaveLength(2);
    });

    it("não chama o batch quando a empresa não tem nenhuma página conectada", async () => {
      const savedAt = Timestamp.fromMillis(1755043200000);
      mockDocSet.mockResolvedValueOnce(undefined);
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          companyId: COMPANY_ID,
          connected: true,
          fbUserId: "10159876543210987",
          fbUserName: "Ana Paula Ferreira",
          secretRef: `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
          pages: [],
          connectedBy: UID,
          connectedAt: savedAt,
          updatedAt: savedAt,
        }),
      });

      await FacebookAdsIntegrationRepository.save(COMPANY_ID, UID, {
        fbUserId: "10159876543210987",
        fbUserName: "Ana Paula Ferreira",
        secretRef: `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
        pages: [],
      });

      expect(mockBatch).not.toHaveBeenCalled();
    });
  });
});
