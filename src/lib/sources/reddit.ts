import type { SourceResult, RawSignal } from "@/types/trend";

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_URL = "https://oauth.reddit.com/r/france/hot?limit=25";
const USER_AGENT = "web:kaza-trend-radar:v1.0 (by /u/thomasdjorno)";

interface RedditChild {
  data?: {
    title?: string;
    ups?: number;
    num_comments?: number;
    link_flair_text?: string | null;
    permalink?: string;
  };
}

interface RedditResponse {
  data?: { children?: RedditChild[] };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Le endpoint public www.reddit.com/*.json est massivement bloqué (403)
 * depuis les IP de data-centers, peu importe le User-Agent. L'API OAuth
 * officielle (client_credentials, lecture seule) reste fiable.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET manquantes");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Reddit OAuth HTTP ${res.status}`);
  }

  const data: { access_token?: string; expires_in?: number } = await res.json();
  if (!data.access_token) {
    throw new Error("Reddit OAuth : pas de token dans la réponse");
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };
  return cachedToken.value;
}

export async function fetchReddit(): Promise<SourceResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const token = await getAccessToken();
    const res = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Reddit HTTP ${res.status}`);
    }
    const parsed: RedditResponse = await res.json();
    const children = parsed.data?.children ?? [];

    const signals: RawSignal[] = children
      .filter((c) => c.data?.title)
      .map((c) => {
        const d = c.data!;
        const parts: string[] = [];
        if (typeof d.ups === "number") parts.push(`${d.ups} upvotes`);
        if (typeof d.num_comments === "number")
          parts.push(`${d.num_comments} commentaires`);
        if (d.link_flair_text) parts.push(d.link_flair_text);
        return {
          source: "reddit" as const,
          titre: d.title!,
          metrique: parts.join(" · ") || undefined,
          url: d.permalink ? `https://reddit.com${d.permalink}` : undefined,
        };
      });

    return { source: "reddit", ok: true, signals, fetchedAt };
  } catch (err) {
    return {
      source: "reddit",
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
      signals: [],
      fetchedAt,
    };
  }
}
