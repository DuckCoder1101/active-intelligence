const GRAPH_API_VERSION = "v23.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** Máximo de páginas seguidas via `paging.next` numa única chamada — trava de segurança pra um job agendado sem supervisão humana. */
const MAX_PAGES = 50;

interface FacebookProfile {
  id: string;
  name: string;
}

interface FacebookPage {
  id: string;
  name: string;
}

export interface FacebookAdAccountRaw {
  id: string;
  name: string;
  account_id: string;
  currency: string;
}

export interface FacebookAdAccountSummary {
  balance: number | null;
  amountSpent: number | null;
  currency: string;
  spendCap: number | null;
}

export interface FacebookCampaignRaw {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective?: string;
}

export interface FacebookInsightAction {
  action_type: string;
  value: string;
}

export interface FacebookDailyInsightRow {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  actions?: FacebookInsightAction[];
  date_start: string;
}

interface GraphPaging {
  next?: string;
}

/** `path` é só pra mensagem de erro — mantém o mesmo formato independente de estarmos seguindo paginação ou não. */
async function fetchGraph<T>(url: URL, path: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Graph API ${path} falhou (${res.status}): ${await res.text()}`,
    );
  }
  return res.json() as Promise<T>;
}

function buildUrl(path: string, params: Record<string, string>): URL {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function graphGet<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  return fetchGraph<T>(buildUrl(path, params), path);
}

/** Segue `paging.next` até esgotar ou atingir MAX_PAGES. */
async function graphGetPaginated<T>(
  path: string,
  params: Record<string, string>,
): Promise<T[]> {
  const results: T[] = [];
  let url: URL | null = buildUrl(path, params);

  let pages = 0;
  while (url && pages < MAX_PAGES) {
    const body: { data: T[]; paging?: GraphPaging } = await fetchGraph(url, path);
    results.push(...body.data);
    url = body.paging?.next ? new URL(body.paging.next) : null;
    pages += 1;
  }
  return results;
}

/** Troca/lê dados do Facebook via Graph API. App ID/Secret vêm de FACEBOOK_APP_ID/FACEBOOK_APP_SECRET (.env). */
export class FacebookGraphService {
  static async exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
    const body = await graphGet<{ access_token: string }>("/oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: process.env.FACEBOOK_APP_ID ?? "",
      client_secret: process.env.FACEBOOK_APP_SECRET ?? "",
      fb_exchange_token: shortLivedToken,
    });
    return body.access_token;
  }

  static async getProfile(accessToken: string): Promise<FacebookProfile> {
    return graphGet<FacebookProfile>("/me", {
      fields: "id,name",
      access_token: accessToken,
    });
  }

  static async listPages(accessToken: string): Promise<FacebookPage[]> {
    const body = await graphGet<{ data: FacebookPage[] }>("/me/accounts", {
      fields: "id,name",
      access_token: accessToken,
    });
    return body.data;
  }

  /** `id` já vem prefixado com `act_`, pronto pra usar nas outras chamadas de conta de anúncios. */
  static async listAdAccounts(
    accessToken: string,
  ): Promise<FacebookAdAccountRaw[]> {
    return graphGetPaginated<FacebookAdAccountRaw>("/me/adaccounts", {
      fields: "id,name,account_id,currency",
      access_token: accessToken,
    });
  }

  /** `balance`/`amount_spent`/`spend_cap` voltam da Graph API em centavos (unidade menor da moeda) — convertidos aqui pra unidade cheia. */
  static async getAdAccountSummary(
    adAccountId: string,
    accessToken: string,
  ): Promise<FacebookAdAccountSummary> {
    const body = await graphGet<{
      balance?: string;
      amount_spent?: string;
      currency: string;
      spend_cap?: string;
    }>(`/${adAccountId}`, {
      fields: "balance,amount_spent,currency,spend_cap",
      access_token: accessToken,
    });

    const toUnits = (raw?: string): number | null =>
      raw === undefined ? null : Number(raw) / 100;

    return {
      balance: toUnits(body.balance),
      amountSpent: toUnits(body.amount_spent),
      currency: body.currency,
      spendCap: toUnits(body.spend_cap),
    };
  }

  /** Exclui campanhas DELETED/ARCHIVED direto na Graph API pra não inflar payload em contas antigas. */
  static async listCampaigns(
    adAccountId: string,
    accessToken: string,
  ): Promise<FacebookCampaignRaw[]> {
    return graphGetPaginated<FacebookCampaignRaw>(`/${adAccountId}/campaigns`, {
      fields: "id,name,status,effective_status,objective",
      filtering: JSON.stringify([
        { field: "effective_status", operator: "NOT_IN", value: ["DELETED", "ARCHIVED"] },
      ]),
      access_token: accessToken,
    });
  }

  /** Uma chamada cobre todas as campanhas do período (level=campaign) — não é uma chamada por campanha. */
  static async getDailyInsights(
    adAccountId: string,
    accessToken: string,
    since: string,
    until: string,
  ): Promise<FacebookDailyInsightRow[]> {
    return graphGetPaginated<FacebookDailyInsightRow>(
      `/${adAccountId}/insights`,
      {
        level: "campaign",
        time_increment: "1",
        time_range: JSON.stringify({ since, until }),
        fields: "campaign_id,campaign_name,spend,actions,date_start",
        access_token: accessToken,
      },
    );
  }
}
