import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSecret = vi.fn();
const mockCreateSecret = vi.fn();
const mockAddSecretVersion = vi.fn();
const mockAccessSecretVersion = vi.fn();

vi.mock("@google-cloud/secret-manager", () => ({
  SecretManagerServiceClient: vi.fn().mockImplementation(function () {
    return {
      getSecret: mockGetSecret,
      createSecret: mockCreateSecret,
      addSecretVersion: mockAddSecretVersion,
      accessSecretVersion: mockAccessSecretVersion,
    };
  }),
}));

const { MetaSecretRepository } = await import(
  "../../src/repositories/meta-secret.repository"
);

const COMPANY_ID = "c4f1e8a2b6d94f0e8a1c2b3d4e5f6a7b";
const PROJECT_ID = "activeimob-74a7d";
const SECRET_NAME = `projects/${PROJECT_ID}/secrets/facebook-ads-token-${COMPANY_ID}`;
const FB_TOKEN =
  "EAAG7ZBZC9ZBZBQoBALongLivedTokenZAqZBoZBZCZAZBqZBoZBZCZAZBqZBoZBZCZAZBq";

describe("MetaSecretRepository", () => {
  const originalProjectId = process.env.GCLOUD_PROJECT;

  beforeEach(() => {
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.GCLOUD_PROJECT = originalProjectId;
  });

  describe("saveToken", () => {
    it("cria o secret quando ele ainda não existe e adiciona a primeira versão", async () => {
      mockGetSecret.mockRejectedValueOnce(
        Object.assign(new Error("Secret not found"), { code: 5 }),
      );
      mockCreateSecret.mockResolvedValueOnce([{ name: SECRET_NAME }]);
      mockAddSecretVersion.mockResolvedValueOnce([
        { name: `${SECRET_NAME}/versions/1` },
      ]);


      const secretRef = await MetaSecretRepository.saveToken(
        COMPANY_ID,
        FB_TOKEN,
      );

      expect(secretRef).toBe(SECRET_NAME);
      expect(mockCreateSecret).toHaveBeenCalledWith({
        parent: `projects/${PROJECT_ID}`,
        secretId: `facebook-ads-token-${COMPANY_ID}`,
        secret: { replication: { automatic: {} } },
      });
      expect(mockAddSecretVersion).toHaveBeenCalledWith({
        parent: SECRET_NAME,
        payload: { data: Buffer.from(FB_TOKEN, "utf8") },
      });
    });

    it("reaproveita o secret existente sem recriar, apenas adiciona nova versão", async () => {
      mockGetSecret.mockResolvedValueOnce([{ name: SECRET_NAME }]);
      mockAddSecretVersion.mockResolvedValueOnce([
        { name: `${SECRET_NAME}/versions/2` },
      ]);


      const secretRef = await MetaSecretRepository.saveToken(
        COMPANY_ID,
        FB_TOKEN,
      );

      expect(secretRef).toBe(SECRET_NAME);
      expect(mockCreateSecret).not.toHaveBeenCalled();
      expect(mockAddSecretVersion).toHaveBeenCalledTimes(1);
    });

    it("lança erro se GCLOUD_PROJECT não estiver definido", async () => {
      delete process.env.GCLOUD_PROJECT;


      await expect(
        MetaSecretRepository.saveToken(COMPANY_ID, FB_TOKEN),
      ).rejects.toThrow(/GCLOUD_PROJECT não definido/);
    });
  });

  describe("getToken", () => {
    it("devolve o token guardado na versão mais recente do secret", async () => {
      mockAccessSecretVersion.mockResolvedValueOnce([
        { payload: { data: Buffer.from(FB_TOKEN, "utf8") } },
      ]);


      const token = await MetaSecretRepository.getToken(SECRET_NAME);

      expect(token).toBe(FB_TOKEN);
      expect(mockAccessSecretVersion).toHaveBeenCalledWith({
        name: `${SECRET_NAME}/versions/latest`,
      });
    });

    it("lança erro se a versão do secret não tiver payload", async () => {
      mockAccessSecretVersion.mockResolvedValueOnce([{ payload: undefined }]);


      await expect(
        MetaSecretRepository.getToken(SECRET_NAME),
      ).rejects.toThrow(`Secret ${SECRET_NAME} não tem payload.`);
    });
  });
});
