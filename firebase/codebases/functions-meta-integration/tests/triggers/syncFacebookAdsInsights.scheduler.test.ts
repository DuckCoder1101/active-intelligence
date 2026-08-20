import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase-functions/scheduler", () => ({
  onSchedule: (_config: unknown, handler: () => Promise<void>) => handler,
}));

const mockGetAllCompanies = vi.fn();

vi.mock("functions-shared", () => ({
  CompanyRepository: { getAllCompanies: mockGetAllCompanies },
}));

const mockIntegrationGet = vi.fn();

vi.mock("../../src/repositories/facebook-ads-integration.repository", () => ({
  FacebookAdsIntegrationRepository: { get: mockIntegrationGet },
}));

const mockSyncCompany = vi.fn();

vi.mock("../../src/services/facebook-ads-sync.service", () => ({
  FacebookAdsSyncService: { syncCompany: mockSyncCompany },
}));

const { syncFacebookAdsInsights } = await import(
  "../../src/triggers/syncFacebookAdsInsights.scheduler"
);

describe("syncFacebookAdsInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sincroniza só as empresas conectadas com conta de anúncios selecionada", async () => {
    mockGetAllCompanies.mockResolvedValueOnce([
      { companyId: "company-a" },
      { companyId: "company-b" },
      { companyId: "company-c" },
    ]);
    mockIntegrationGet.mockImplementation(async (companyId: string) => {
      if (companyId === "company-a") {
        return { connected: true, selectedAdAccountId: "act_111" };
      }
      if (companyId === "company-b") {
        return { connected: false, selectedAdAccountId: null };
      }
      if (companyId === "company-c") {
        return { connected: true, selectedAdAccountId: null };
      }
      return null;
    });
    mockSyncCompany.mockResolvedValue(undefined);

    await syncFacebookAdsInsights();

    expect(mockSyncCompany).toHaveBeenCalledTimes(1);
    expect(mockSyncCompany).toHaveBeenCalledWith("company-a", 30);
  });

  it("uma empresa falhando não impede que as outras sejam sincronizadas", async () => {
    mockGetAllCompanies.mockResolvedValueOnce([
      { companyId: "company-a" },
      { companyId: "company-b" },
    ]);
    mockIntegrationGet.mockResolvedValue({
      connected: true,
      selectedAdAccountId: "act_111",
    });
    mockSyncCompany.mockImplementation(async (companyId: string) => {
      if (companyId === "company-a") throw new Error("boom");
    });

    await expect(syncFacebookAdsInsights()).resolves.not.toThrow();

    expect(mockSyncCompany).toHaveBeenCalledWith("company-a", 30);
    expect(mockSyncCompany).toHaveBeenCalledWith("company-b", 30);
  });
});
