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

  describe("listAdAccounts", () => {
    it("segue paging.next até a última página", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: "act_111", name: "Conta A", account_id: "111", currency: "BRL" },
            ],
            paging: { next: "https://graph.facebook.com/v23.0/me/adaccounts?after=abc" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: "act_222", name: "Conta B", account_id: "222", currency: "USD" },
            ],
            paging: {},
          }),
        });
      global.fetch = fetchMock as unknown as typeof fetch;

      const accounts = await FacebookGraphService.listAdAccounts(LONG_LIVED_TOKEN);

      expect(accounts).toEqual([
        { id: "act_111", name: "Conta A", account_id: "111", currency: "BRL" },
        { id: "act_222", name: "Conta B", account_id: "222", currency: "USD" },
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("lança erro quando a Graph API responde com falha", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: { code: 10, type: "OAuthException" } }),
      }) as unknown as typeof fetch;

      await expect(
        FacebookGraphService.listAdAccounts(LONG_LIVED_TOKEN),
      ).rejects.toThrow(/Graph API \/me\/adaccounts falhou \(403\)/);
    });
  });

  describe("getAdAccountSummary", () => {
    it("converte balance/amount_spent/spend_cap de centavos pra unidade cheia", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: "150000",
          amount_spent: "980000",
          currency: "BRL",
          spend_cap: "500000",
        }),
      }) as unknown as typeof fetch;

      const summary = await FacebookGraphService.getAdAccountSummary(
        "act_123456789",
        LONG_LIVED_TOKEN,
      );

      expect(summary).toEqual({
        balance: 1500,
        amountSpent: 9800,
        currency: "BRL",
        spendCap: 5000,
      });
    });

    it("devolve null quando a Graph API não manda o campo", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ currency: "BRL" }),
      }) as unknown as typeof fetch;

      const summary = await FacebookGraphService.getAdAccountSummary(
        "act_123456789",
        LONG_LIVED_TOKEN,
      );

      expect(summary).toEqual({
        balance: null,
        amountSpent: null,
        currency: "BRL",
        spendCap: null,
      });
    });
  });

  describe("listCampaigns", () => {
    it("filtra campanhas DELETED/ARCHIVED direto na Graph API", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "23851",
              name: "Campanha Lançamento",
              status: "ACTIVE",
              effective_status: "ACTIVE",
              objective: "OUTCOME_LEADS",
            },
          ],
          paging: {},
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const campaigns = await FacebookGraphService.listCampaigns(
        "act_123456789",
        LONG_LIVED_TOKEN,
      );

      expect(campaigns).toHaveLength(1);
      const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
      const filtering = JSON.parse(calledUrl.searchParams.get("filtering") ?? "[]");
      expect(filtering).toEqual([
        { field: "effective_status", operator: "NOT_IN", value: ["DELETED", "ARCHIVED"] },
      ]);
    });
  });

  describe("getDailyInsights", () => {
    it("chama /insights com level=campaign e time_range/time_increment corretos", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              campaign_id: "23851",
              campaign_name: "Campanha Lançamento",
              spend: "123.45",
              actions: [{ action_type: "lead", value: "3" }],
              date_start: "2026-08-01",
            },
          ],
          paging: {},
        }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const rows = await FacebookGraphService.getDailyInsights(
        "act_123456789",
        LONG_LIVED_TOKEN,
        "2026-08-01",
        "2026-08-19",
      );

      expect(rows).toHaveLength(1);
      const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
      expect(calledUrl.searchParams.get("level")).toBe("campaign");
      expect(calledUrl.searchParams.get("time_increment")).toBe("1");
      expect(JSON.parse(calledUrl.searchParams.get("time_range") ?? "{}")).toEqual({
        since: "2026-08-01",
        until: "2026-08-19",
      });
    });
  });
});
