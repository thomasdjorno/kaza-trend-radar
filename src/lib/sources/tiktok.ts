import type { SourceResult, RawSignal } from "@/types/trend";

const URL =
  "https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?page=1&limit=20&period=7&country_code=FR&sort_by=popular";

interface TiktokHashtag {
  hashtag_name?: string;
  publish_cnt?: number;
  video_views?: number;
  rank?: number;
}

interface TiktokResponse {
  data?: { list?: TiktokHashtag[] };
}

/**
 * Source fragile : TikTok Creative Center n'est pas une API publique
 * documentée et peut casser (auth, structure, blocage géo) sans préavis.
 * Toujours échouer silencieusement vers le reste de l'agrégation.
 */
export async function fetchTiktok(): Promise<SourceResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: "https://ads.tiktok.com/business/creativecenter/",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`TikTok HTTP ${res.status}`);
    }
    const parsed: TiktokResponse = await res.json();
    const list = parsed.data?.list ?? [];

    const signals: RawSignal[] = list
      .filter((item) => item.hashtag_name)
      .map((item) => {
        const parts: string[] = [];
        if (item.video_views)
          parts.push(`${item.video_views.toLocaleString("fr-FR")} vues`);
        if (item.publish_cnt)
          parts.push(`${item.publish_cnt.toLocaleString("fr-FR")} publications`);
        return {
          source: "tiktok" as const,
          titre: `#${item.hashtag_name}`,
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
