import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FacebookGraphService } from "../../src/services/facebook-graph.service";

const SHORT_LIVED_TOKEN =
  "EAAG7ZBZC9ZBZBQoBAK8ZC7ZBZBqZBoZBZCZAZBqZBoZBZCZAZBqZBoZBZCZAZBq";
const LONG_LIVED_TOKEN =
  "EAAG7ZBZC9ZBZBQoBALongLivedTokenZAqZBoZBZCZAZBqZBoZBZCZAZBqZBoZBZCZAZBq";

describe("FacebookGraphService", () => {
  const originalFetch = global.fetch;
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;

  beforeEach(() => {
    process.env.FACEBOOK_APP_ID = "1234567890123456";
    process.env.FACEBOOK_APP_SECRET = "b3f1c2a9d8e7f6a5b4c3d2e1f0a9b8c7";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    vi.restoreAllMocks();
  });

  describe("exchangeForLongLivedToken", () => {
    it("troca o short-lived token pelo long-lived e usa client_id/client_secret do ambiente", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: LONG_LIVED_TOKEN,
          token_type: "bearer",
          expires_in: 5183944,
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const token =
        await FacebookGraphService.exchangeForLongLivedToken(SHORT_LIVED_TOKEN);

      expect(token).toBe(LONG_LIVED_TOKEN);
      const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
      expect(calledUrl.pathname).toBe("/v23.0/oauth/access_token");
      expect(calledUrl.searchParams.get("grant_type")).toBe(
        "fb_exchange_token",
      );
      expect(calledUrl.searchParams.get("client_id")).toBe(
        "1234567890123456",
      );
      expect(calledUrl.searchParams.get("client_secret")).toBe(
        "b3f1c2a9d8e7f6a5b4c3d2e1f0a9b8c7",
      );
      expect(calledUrl.searchParams.get("fb_exchange_token")).toBe(
        SHORT_LIVED_TOKEN,
      );
    });

    it("lança erro quando a Graph API responde com falha", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            error: {
              message: "Error validating access token",
              type: "OAuthException",
              code: 190,
            },
          }),
      }) as unknown as typeof fetch;

      await expect(
        FacebookGraphService.exchangeForLongLivedToken(SHORT_LIVED_TOKEN),
      ).rejects.toThrow(/Graph API \/oauth\/access_token falhou \(400\)/);
    });
  });

  describe("getProfile", () => {
    it("devolve id e name do usuário autenticado", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "10159876543210987",
          name: "Ana Paula Ferreira",
        }),
      }) as unknown as typeof fetch;

      const profile = await FacebookGraphService.getProfile(LONG_LIVED_TOKEN);

      expect(profile).toEqual({
        id: "10159876543210987",
        name: "Ana Paula Ferreira",
      });
    });
  });

  describe("listPages", () => {
    it("devolve a lista de páginas administradas pelo usuário", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: "102934857612345", name: "Imobiliária Vista Alegre" },
            { id: "108273645910238", name: "Vista Alegre Empreendimentos" },
          ],
          paging: { cursors: { before: "abc", after: "def" } },
        }),
      }) as unknown as typeof fetch;

      const pages = await FacebookGraphService.listPages(LONG_LIVED_TOKEN);

      expect(pages).toEqual([
        { id: "102934857612345", name: "Imobiliária Vista Alegre" },
        { id: "108273645910238", name: "Vista Alegre Empreendimentos" },
      ]);
    });

    it("lança erro quando a Graph API responde com falha", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Invalid OAuth access token.",
      }) as unknown as typeof fetch;

      await expect(
        FacebookGraphService.listPages(LONG_LIVED_TOKEN),
      ).rejects.toThrow(/Graph API \/me\/accounts falhou \(401\)/);
    });
  });
});
