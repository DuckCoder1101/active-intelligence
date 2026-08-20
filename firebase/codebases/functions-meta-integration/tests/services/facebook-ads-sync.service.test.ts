import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIntegrationGetRaw = vi.fn();

vi.mock("../../src/repositories/facebook-ads-integration.repository", () => ({
  FacebookAdsIntegrationRepository: { getRaw: mockIntegrationGetRaw },
}));

const mockGetSnapshot = vi.fn();
const mockSaveSnapshot = vi.fn();
const mockSaveSyncError = vi.fn();
const mockSaveDailyInsights = vi.fn();
const mockPruneOldDailyInsights = vi.fn();

vi.mock("../../src/repositories/facebook-ads-insights.repository", () => ({
  FacebookAdsInsightsRepository: {
    getSnapshot: mockGetSnapshot,
    saveSnapshot: mockSaveSnapshot,
    saveSyncError: mockSaveSyncError,
    saveDailyInsights: mockSaveDailyInsights,
    pruneOldDailyInsights: mockPruneOldDailyInsights,
  },
}));

const mockGetToken = vi.fn();

vi.mock("../../src/repositories/meta-secret.repository", () => ({
  MetaSecretRepository: { getToken: mockGetToken },
}));

const mockGetAdAccountSummary = vi.fn();
const mockListCampaigns = vi.fn();
const mockGetDailyInsights = vi.fn();

vi.mock("../../src/services/facebook-graph.service", () => ({
  FacebookGraphService: {
    getAdAccountSummary: mockGetAdAccountSummary,
    listCampaigns: mockListCampaigns,
    getDailyInsights: mockGetDailyInsights,
  },
}));

const { FacebookAdsSyncService } = await import(
  "../../src/services/facebook-ads-sync.service"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";

describe("FacebookAdsSyncService.syncCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não faz nada quando a empresa não está conectada ou não tem conta selecionada", async () => {
    mockIntegrationGetRaw.mockResolvedValueOnce({ connected: false });

    await FacebookAdsSyncService.syncCompany(COMPANY_ID, 30);

    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it("busca resumo/campanhas/insights, agrupa por dia e grava no cache no caminho feliz", async () => {
    mockIntegrationGetRaw.mockResolvedValueOnce({
      connected: true,
      selectedAdAccountId: "act_111",
      secretRef: "projects/x/secrets/facebook-ads-token-c1",
    });
    mockGetToken.mockResolvedValueOnce("long-lived-token");
    mockGetAdAccountSummary.mockResolvedValueOnce({
      balance: 1500,
      amountSpent: 9000,
      currency: "BRL",
      spendCap: null,
    });
    mockListCampaigns.mockResolvedValueOnce([
      {
        id: "23851",
        name: "Campanha Lançamento",
        status: "ACTIVE",
        effective_status: "ACTIVE",
        objective: "OUTCOME_LEADS",
      },
    ]);
    mockGetDailyInsights.mockResolvedValueOnce([
      {
        campaign_id: "23851",
        campaign_name: "Campanha Lançamento",
        spend: "120.50",
        actions: [{ action_type: "lead", value: "3" }],
        date_start: "2026-08-18",
      },
      {
        campaign_id: "23851",
        campaign_name: "Campanha Lançamento",
        spend: "80.00",
        actions: [{ action_type: "onsite_conversion.lead_grouped", value: "1" }],
        date_start: "2026-08-19",
      },
    ]);

    await FacebookAdsSyncService.syncCompany(COMPANY_ID, 30);

    expect(mockGetToken).toHaveBeenCalledWith("projects/x/secrets/facebook-ads-token-c1");
    expect(mockSaveDailyInsights).toHaveBeenCalledWith(COMPANY_ID, [
      { date: "2026-08-18", campaigns: [{ campaignId: "23851", spend: 120.5, leads: 3 }] },
      { date: "2026-08-19", campaigns: [{ campaignId: "23851", spend: 80, leads: 1 }] },
    ]);
    expect(mockSaveSnapshot).toHaveBeenCalledWith(COMPANY_ID, {
      adAccountId: "act_111",
      currency: "BRL",
      balance: 1500,
      spendCap: undefined,
      campaigns: [
        {
          campaignId: "23851",
          campaignName: "Campanha Lançamento",
          status: "ACTIVE",
          effectiveStatus: "ACTIVE",
          objective: "OUTCOME_LEADS",
        },
      ],
    });
    expect(mockPruneOldDailyInsights).toHaveBeenCalledTimes(1);
    expect(mockSaveSyncError).not.toHaveBeenCalled();
  });

  it("classifica erro de token inválido e grava via saveSyncError, sem lançar", async () => {
    mockIntegrationGetRaw.mockResolvedValueOnce({
      connected: true,
      selectedAdAccountId: "act_111",
      secretRef: "projects/x/secrets/facebook-ads-token-c1",
    });
    mockGetToken.mockResolvedValueOnce("expired-token");
    mockGetAdAccountSummary.mockRejectedValueOnce(
      new Error(
        'Graph API /act_111 falhou (401): {"error":{"message":"Error validating access token","type":"OAuthException","code":190}}',
      ),
    );

    await expect(FacebookAdsSyncService.syncCompany(COMPANY_ID, 30)).resolves.not.toThrow();

    expect(mockSaveSyncError).toHaveBeenCalledWith(
      COMPANY_ID,
      "token_invalid",
      expect.stringContaining("OAuthException"),
    );
    expect(mockSaveSnapshot).not.toHaveBeenCalled();
  });

  it("classifica erros sem corpo JSON reconhecível como unknown", async () => {
    mockIntegrationGetRaw.mockResolvedValueOnce({
      connected: true,
      selectedAdAccountId: "act_111",
      secretRef: "projects/x/secrets/facebook-ads-token-c1",
    });
    mockGetToken.mockRejectedValueOnce(new Error("network timeout"));

    await FacebookAdsSyncService.syncCompany(COMPANY_ID, 30);

    expect(mockSaveSyncError).toHaveBeenCalledWith(COMPANY_ID, "unknown", "network timeout");
  });
});
