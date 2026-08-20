import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";
import type { CallableRequest } from "firebase-functions/https";
import { Timestamp } from "firebase-admin/firestore";

const mockRequireCompanyAccess = vi.fn();

vi.mock("functions-shared", () => ({
  onCallHandler: (fn: (req: CallableRequest) => unknown) => fn,
  requireCompanyAccess: mockRequireCompanyAccess,
}));

const mockIntegrationGet = vi.fn();

vi.mock("../../src/repositories/facebook-ads-integration.repository", () => ({
  FacebookAdsIntegrationRepository: { get: mockIntegrationGet },
}));

const mockGetSnapshot = vi.fn();
const mockGetDailyInsights = vi.fn();

vi.mock("../../src/repositories/facebook-ads-insights.repository", () => ({
  FacebookAdsInsightsRepository: {
    getSnapshot: mockGetSnapshot,
    getDailyInsights: mockGetDailyInsights,
  },
}));

const { getMarketingDashboardHandler } = await import(
  "../../src/handlers/getMarketingDashboard"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";

function buildRequest(data: unknown): CallableRequest {
  return { data } as CallableRequest;
}

describe("getMarketingDashboardHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireCompanyAccess.mockReturnValue({ companyId: COMPANY_ID });
  });

  it("rejeita quando companyId não é enviado", async () => {
    await expect(
      getMarketingDashboardHandler(buildRequest({})),
    ).rejects.toThrow(HttpsError);
  });

  it("devolve not_connected quando a empresa nunca conectou o Facebook", async () => {
    mockIntegrationGet.mockResolvedValueOnce(null);

    const result = await getMarketingDashboardHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toEqual({ status: "not_connected" });
    expect(mockGetSnapshot).not.toHaveBeenCalled();
  });

  it("devolve not_connected quando integration.connected é false", async () => {
    mockIntegrationGet.mockResolvedValueOnce({ connected: false });

    const result = await getMarketingDashboardHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toEqual({ status: "not_connected" });
  });

  it("devolve no_ads_permission quando a última busca de contas falhou", async () => {
    mockIntegrationGet.mockResolvedValueOnce({
      connected: true,
      adAccountsFetchFailed: true,
    });

    const result = await getMarketingDashboardHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toEqual({ status: "no_ads_permission" });
  });

  it("devolve no_account_selected (com a lista de contas) quando ainda não escolheu uma", async () => {
    const adAccounts = [{ adAccountId: "act_111", adAccountName: "Conta A", currency: "BRL" }];
    mockIntegrationGet.mockResolvedValueOnce({
      connected: true,
      adAccountsFetchFailed: false,
      selectedAdAccountId: null,
      adAccounts,
    });

    const result = await getMarketingDashboardHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toEqual({ status: "no_account_selected", adAccounts });
  });

  it("devolve no_account_selected quando o backfill inicial ainda não rodou", async () => {
    mockIntegrationGet.mockResolvedValueOnce({
      connected: true,
      adAccountsFetchFailed: false,
      selectedAdAccountId: "act_111",
      adAccounts: [{ adAccountId: "act_111", adAccountName: "Conta A", currency: "BRL" }],
    });
    mockGetSnapshot.mockResolvedValueOnce(null);

    const result = await getMarketingDashboardHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result.status).toBe("no_account_selected");
  });

  it("devolve ok com os dados cacheados no caminho feliz", async () => {
    const updatedAt = Timestamp.fromMillis(1755043200000);
    mockIntegrationGet.mockResolvedValueOnce({
      connected: true,
      adAccountsFetchFailed: false,
      selectedAdAccountId: "act_111",
      adAccounts: [{ adAccountId: "act_111", adAccountName: "Conta A", currency: "BRL" }],
    });
    mockGetSnapshot.mockResolvedValueOnce({
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
      updatedAt,
    });
    mockGetDailyInsights.mockResolvedValueOnce([
      { date: "2026-08-19", campaigns: [{ campaignId: "23851", spend: 120, leads: 3 }] },
    ]);

    const result = await getMarketingDashboardHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toEqual({
      status: "ok",
      adAccountName: "Conta A",
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
      dailyInsights: [
        { date: "2026-08-19", campaigns: [{ campaignId: "23851", spend: 120, leads: 3 }] },
      ],
      updatedAt: updatedAt.toMillis(),
      lastSyncError: undefined,
    });
  });
});
