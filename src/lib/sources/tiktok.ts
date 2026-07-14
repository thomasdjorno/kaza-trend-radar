import type { SourceResult, RawSignal } from "@/types/trend";

const URL = "https://ads.tiktok.com/CreativeOne/KnowledgeAPI/GetHashtagList";

interface TiktokHashtagItem {
  hashtagName?: string;
  publishCnt?: number;
  vv?: number;
  rankIndex?: number;
}

interface TiktokResponse {
  BaseResp?: { StatusCode?: number; StatusMessage?: string };
  items?: TiktokHashtagItem[];
}

/**
 * Source fragile : TikTok Creative Center n'est pas une API publique
 * documentée. L'ancien endpoint (creative_radar_api) a été remplacé par
 * CreativeOne/KnowledgeAPI/GetHashtagList, qui exige une session
 * connectée (cookie TIKTOK_COOKIE d'un compte Creative Center/Ads).
 * Le cookie expire périodiquement et doit être renouvelé manuellement.
 * Toujours échouer silencieusement vers le reste de l'agrégation.
 */
export async function fetchTiktok(): Promise<SourceResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const cookie = process.env.TIKTOK_COOKIE;
    if (!cookie) {
      throw new Error("TIKTOK_COOKIE manquante");
    }

    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer:
          "https://ads.tiktok.com/creative/creativeCenter/trends/hashtag?region=FR&period=7",
        Cookie: cookie,
      },
      body: JSON.stringify({
        timeRange: 7,
        countryCode: "FR",
        page: 1,
        limit: 20,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`TikTok HTTP ${res.status}`);
    }
    const parsed: TiktokResponse = await res.json();
    if (parsed.BaseResp?.StatusCode) {
      throw new Error(
        parsed.BaseResp.StatusMessage || `TikTok API code ${parsed.BaseResp.StatusCode}`
      );
    }

    const signals: RawSignal[] = (parsed.items ?? [])
      .filter((item) => item.hashtagName)
      .map((item) => {
        const parts: string[] = [];
        if (item.vv) parts.push(`${item.vv.toLocaleString("fr-FR")} vues`);
        if (item.publishCnt)
          parts.push(`${item.publishCnt.toLocaleString("fr-FR")} publications`);
        return {
          source: "tiktok" as const,
          titre: `#${item.hashtagName}`,
          metrique: parts.join(" · ") || undefined,
        };
      });

    return { source: "tiktok", ok: true, signals, fetchedAt };
  } catch (err) {
    return {
      source: "tiktok",
      ok: false,
      error:
        err instanceof Error
          ? `Source fragile indisponible : ${err.message}`
          : "Source fragile indisponible",
      signals: [],
      fetchedAt,
    };
  }
}
