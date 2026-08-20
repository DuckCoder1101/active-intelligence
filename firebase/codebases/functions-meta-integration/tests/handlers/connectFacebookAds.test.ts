import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";
import type { CallableRequest } from "firebase-functions/https";

const mockRequireCompanyAccess = vi.fn();

vi.mock("functions-shared", () => ({
  onCallHandler: (fn: (req: CallableRequest) => unknown) => fn,
  requireCompanyAccess: mockRequireCompanyAccess,
}));

const mockExchangeForLongLivedToken = vi.fn();
const mockGetProfile = vi.fn();
const mockListPages = vi.fn();
const mockListAdAccounts = vi.fn();

vi.mock("../../src/services/facebook-graph.service", () => ({
  FacebookGraphService: {
    exchangeForLongLivedToken: mockExchangeForLongLivedToken,
    getProfile: mockGetProfile,
    listPages: mockListPages,
    listAdAccounts: mockListAdAccounts,
  },
}));

const mockSyncCompany = vi.fn();

vi.mock("../../src/services/facebook-ads-sync.service", () => ({
  FacebookAdsSyncService: { syncCompany: mockSyncCompany },
}));

const mockSaveToken = vi.fn();

vi.mock("../../src/repositories/meta-secret.repository", () => ({
  MetaSecretRepository: { saveToken: mockSaveToken },
}));

const mockSave = vi.fn();

vi.mock("../../src/repositories/facebook-ads-integration.repository", () => ({
  FacebookAdsIntegrationRepository: { save: mockSave },
}));

const { connectFacebookAdsHandler } = await import(
  "../../src/handlers/connectFacebookAds"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";
const UID = "uid-a8f3c1d2e5b6";
const SHORT_LIVED_TOKEN =
  "EAAG7ZBZC9ZBZBQoBAK8ZC7ZBZBqZBoZBZCZAZBqZBoZBZCZAZBq";
const LONG_LIVED_TOKEN =
  "EAAG7ZBZC9ZBZBQoBALongLivedTokenZAqZBoZBZCZAZBqZBoZBZCZAZBq";

function buildRequest(data: unknown): CallableRequest {
  return { data } as CallableRequest;
}

describe("connectFacebookAdsHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireCompanyAccess.mockReturnValue({ uid: UID, companyId: COMPANY_ID });
  });

  it("rejeita quando companyId/accessToken não são enviados", async () => {
    await expect(
      connectFacebookAdsHandler(buildRequest({})),
    ).rejects.toThrow(HttpsError);
    expect(mockRequireCompanyAccess).not.toHaveBeenCalled();
  });

  it("propaga o erro de permissão sem chamar a Graph API", async () => {
    mockRequireCompanyAccess.mockImplementation(() => {
      throw new HttpsError(
        "permission-denied",
        "Você não tem acesso às integrações da empresa.",
      );
    });

    await expect(
      connectFacebookAdsHandler(
        buildRequest({ companyId: COMPANY_ID, accessToken: SHORT_LIVED_TOKEN }),
      ),
    ).rejects.toThrow("Você não tem acesso às integrações da empresa.");
    expect(mockExchangeForLongLivedToken).not.toHaveBeenCalled();
  });

  it("troca o token, lê perfil/páginas e salva a integração no caminho feliz", async () => {
    mockExchangeForLongLivedToken.mockResolvedValueOnce(LONG_LIVED_TOKEN);
    mockGetProfile.mockResolvedValueOnce({
      id: "10159876543210987",
      name: "Ana Paula Ferreira",
    });
    mockListPages.mockResolvedValueOnce([
      { id: "102934857612345", name: "Imobiliária Vista Alegre" },
    ]);
    mockListAdAccounts.mockResolvedValueOnce([]);
    mockSaveToken.mockResolvedValueOnce(
      `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
    );
    const savedDTO = {
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
      connectedAt: 1755043200000,
      updatedAt: 1755043200000,
    };
    mockSave.mockResolvedValueOnce(savedDTO);

    const result = await connectFacebookAdsHandler(
      buildRequest({ companyId: COMPANY_ID, accessToken: SHORT_LIVED_TOKEN }),
    );

    expect(result).toEqual(savedDTO);
    expect(mockExchangeForLongLivedToken).toHaveBeenCalledWith(
      SHORT_LIVED_TOKEN,
    );
    expect(mockGetProfile).toHaveBeenCalledWith(LONG_LIVED_TOKEN);
    expect(mockListPages).toHaveBeenCalledWith(LONG_LIVED_TOKEN);
    expect(mockListAdAccounts).toHaveBeenCalledWith(LONG_LIVED_TOKEN);
    expect(mockSaveToken).toHaveBeenCalledWith(COMPANY_ID, LONG_LIVED_TOKEN);
    expect(mockSave).toHaveBeenCalledWith(COMPANY_ID, UID, {
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
      adAccounts: [],
      selectedAdAccountId: undefined,
      adAccountsFetchFailed: false,
    });
    expect(mockSyncCompany).not.toHaveBeenCalled();
  });

  it("seleciona automaticamente a conta de anúncios quando só existe uma, e dispara o backfill", async () => {
    mockExchangeForLongLivedToken.mockResolvedValueOnce(LONG_LIVED_TOKEN);
    mockGetProfile.mockResolvedValueOnce({
      id: "10159876543210987",
      name: "Ana Paula Ferreira",
    });
    mockListPages.mockResolvedValueOnce([]);
    mockListAdAccounts.mockResolvedValueOnce([
      {
        id: "act_123456789",
        name: "Conta de Anúncios Vista Alegre",
        account_id: "123456789",
        currency: "BRL",
      },
    ]);
    mockSaveToken.mockResolvedValueOnce(
      `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
    );
    mockSave.mockResolvedValueOnce({
      connected: true,
      fbUserId: "10159876543210987",
      fbUserName: "Ana Paula Ferreira",
      pages: [],
      adAccounts: [
        {
          adAccountId: "act_123456789",
          adAccountName: "Conta de Anúncios Vista Alegre",
          currency: "BRL",
        },
      ],
      selectedAdAccountId: "act_123456789",
      adAccountsFetchFailed: false,
      connectedBy: UID,
      connectedAt: 1755043200000,
      updatedAt: 1755043200000,
    });

    await connectFacebookAdsHandler(
      buildRequest({ companyId: COMPANY_ID, accessToken: SHORT_LIVED_TOKEN }),
    );

    expect(mockSave).toHaveBeenCalledWith(
      COMPANY_ID,
      UID,
      expect.objectContaining({
        adAccounts: [
          {
            adAccountId: "act_123456789",
            adAccountName: "Conta de Anúncios Vista Alegre",
            currency: "BRL",
          },
        ],
        selectedAdAccountId: "act_123456789",
        adAccountsFetchFailed: false,
      }),
    );
    expect(mockSyncCompany).toHaveBeenCalledWith(COMPANY_ID, 90);
  });

  it("não falha a conexão quando listAdAccounts lança erro (ex: falta o escopo ads_read)", async () => {
    mockExchangeForLongLivedToken.mockResolvedValueOnce(LONG_LIVED_TOKEN);
    mockGetProfile.mockResolvedValueOnce({
      id: "10159876543210987",
      name: "Ana Paula Ferreira",
    });
    mockListPages.mockResolvedValueOnce([]);
    mockListAdAccounts.mockRejectedValueOnce(new Error("(#10) Permission denied"));
    mockSaveToken.mockResolvedValueOnce(
      `projects/activeimob-74a7d/secrets/facebook-ads-token-${COMPANY_ID}`,
    );
    mockSave.mockResolvedValueOnce({
      connected: true,
      fbUserId: "10159876543210987",
      fbUserName: "Ana Paula Ferreira",
      pages: [],
      adAccounts: [],
      selectedAdAccountId: null,
      adAccountsFetchFailed: true,
      connectedBy: UID,
      connectedAt: 1755043200000,
      updatedAt: 1755043200000,
    });

    const result = await connectFacebookAdsHandler(
      buildRequest({ companyId: COMPANY_ID, accessToken: SHORT_LIVED_TOKEN }),
    );

    expect(result).toBeDefined();
    expect(mockSave).toHaveBeenCalledWith(
      COMPANY_ID,
      UID,
      expect.objectContaining({
        adAccounts: [],
        selectedAdAccountId: undefined,
        adAccountsFetchFailed: true,
      }),
    );
    expect(mockSyncCompany).not.toHaveBeenCalled();
  });

  it("converte falha da Graph API em failed-precondition sem guardar nenhum secret", async () => {
    mockExchangeForLongLivedToken.mockRejectedValueOnce(
      new Error("Graph API /oauth/access_token falhou (400): invalid code"),
    );

    await expect(
      connectFacebookAdsHandler(
        buildRequest({ companyId: COMPANY_ID, accessToken: SHORT_LIVED_TOKEN }),
      ),
    ).rejects.toThrow("Não foi possível conectar com o Facebook. Tente novamente.");
    expect(mockSaveToken).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
