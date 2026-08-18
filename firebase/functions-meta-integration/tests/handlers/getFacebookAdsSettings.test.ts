import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";
import type { CallableRequest } from "firebase-functions/https";

const mockRequireCompanyAccess = vi.fn();

vi.mock("functions-shared", () => ({
  onCallHandler: (fn: (req: CallableRequest) => unknown) => fn,
  requireCompanyAccess: mockRequireCompanyAccess,
}));

const mockGet = vi.fn();

vi.mock("../../src/repositories/facebook-ads-integration.repository", () => ({
  FacebookAdsIntegrationRepository: { get: mockGet },
}));

const { getFacebookAdsSettingsHandler } = await import(
  "../../src/handlers/getFacebookAdsSettings"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";
const UID = "uid-a8f3c1d2e5b6";

function buildRequest(data: unknown): CallableRequest {
  return { data } as CallableRequest;
}

describe("getFacebookAdsSettingsHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireCompanyAccess.mockReturnValue({ uid: UID, companyId: COMPANY_ID });
  });

  it("rejeita quando companyId não é enviado", async () => {
    await expect(
      getFacebookAdsSettingsHandler(buildRequest({})),
    ).rejects.toThrow(HttpsError);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("propaga o erro de permissão", async () => {
    mockRequireCompanyAccess.mockImplementation(() => {
      throw new HttpsError(
        "permission-denied",
        "Você não tem acesso às integrações da empresa.",
      );
    });

    await expect(
      getFacebookAdsSettingsHandler(buildRequest({ companyId: COMPANY_ID })),
    ).rejects.toThrow("Você não tem acesso às integrações da empresa.");
  });

  it("devolve null quando a empresa ainda não conectou nada", async () => {
    mockGet.mockResolvedValueOnce(null);

    const result = await getFacebookAdsSettingsHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledWith(COMPANY_ID);
  });

  it("devolve o status salvo quando a empresa já conectou", async () => {
    const settings = {
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
      connectedBy: UID,
      connectedAt: 1755043200000,
      updatedAt: 1755043200000,
    };
    mockGet.mockResolvedValueOnce(settings);

    const result = await getFacebookAdsSettingsHandler(
      buildRequest({ companyId: COMPANY_ID }),
    );

    expect(result).toEqual(settings);
  });
});
