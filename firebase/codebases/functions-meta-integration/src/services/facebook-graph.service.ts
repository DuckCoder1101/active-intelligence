const GRAPH_API_VERSION = "v23.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface FacebookProfile {
  id: string;
  name: string;
}

interface FacebookPage {
  id: string;
  name: string;
}

async function graphGet<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Graph API ${path} falhou (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<T>;
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
}
