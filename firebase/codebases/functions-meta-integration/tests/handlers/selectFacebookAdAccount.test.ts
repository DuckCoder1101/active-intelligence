import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";
import type { CallableRequest } from "firebase-functions/https";

const mockRequireCompanyAccess = vi.fn();

vi.mock("functions-shared", () => ({
  onCallHandler: (fn: (req: CallableRequest) => unknown) => fn,
  requireCompanyAccess: mockRequireCompanyAccess,
}));

const mockGet = vi.fn();
const mockSelectAdAccount = vi.fn();

vi.mock("../../src/repositories/facebook-ads-integration.repository", () => ({
  FacebookAdsIntegrationRepository: { get: mockGet, selectAdAccount: mockSelectAdAccount },
}));

const mockSyncCompany = vi.fn();

vi.mock("../../src/services/facebook-ads-sync.service", () => ({
  FacebookAdsSyncService: { syncCompany: mockSyncCompany },
}));

const { selectFacebookAdAccountHandler } = await import(
  "../../src/handlers/selectFacebookAdAccount"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";

function buildRequest(data: unknown): CallableRequest {
  return { data } as CallableRequest;
}

const KNOWN_AD_ACCOUNTS = [
  { adAccountId: "act_111", adAccountName: "Conta A", currency: "BRL" },
  { adAccountId: "act_222", adAccountName: "Conta B", currency: "BRL" },
];

describe("selectFacebookAdAccountHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireCompanyAccess.mockReturnValue({ companyId: COMPANY_ID });
  });

  it("rejeita quando companyId/adAccountId não são enviados", async () => {
    await expect(
      selectFacebookAdAccountHandler(buildRequest({})),
    ).rejects.toThrow(HttpsError);
    expect(mockRequireCompanyAccess).not.toHaveBeenCalled();
  });

  it("rejeita quando a conta de anúncios não está na lista conhecida", async () => {
    mockGet.mockResolvedValueOnce({ adAccounts: KNOWN_AD_ACCOUNTS });

    await expect(
      selectFacebookAdAccountHandler(
        buildRequest({ companyId: COMPANY_ID, adAccountId: "act_999" }),
      ),
    ).rejects.toThrow(/não foi encontrada/);
    expect(mockSelectAdAccount).not.toHaveBeenCalled();
    expect(mockSyncCompany).not.toHaveBeenCalled();
  });

  it("seleciona a conta e dispara o backfill de 90 dias no caminho feliz", async () => {
    mockGet.mockResolvedValueOnce({ adAccounts: KNOWN_AD_ACCOUNTS });
    const updated = { adAccounts: KNOWN_AD_ACCOUNTS, selectedAdAccountId: "act_222" };
    mockSelectAdAccount.mockResolvedValueOnce(updated);

    const result = await selectFacebookAdAccountHandler(
      buildRequest({ companyId: COMPANY_ID, adAccountId: "act_222" }),
    );

    expect(result).toEqual(updated);
    expect(mockSelectAdAccount).toHaveBeenCalledWith(COMPANY_ID, "act_222");
    expect(mockSyncCompany).toHaveBeenCalledWith(COMPANY_ID, 90);
  });
});
