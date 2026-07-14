import type { SourceResult, RawSignal } from "@/types/trend";

const BASE_URL = "https://www.googleapis.com/youtube/v3/videos";

interface YoutubeItem {
  snippet?: { title?: string; channelTitle?: string };
  statistics?: { viewCount?: string };
  contentDetails?: { duration?: string };
}

interface YoutubeResponse {
  items?: YoutubeItem[];
  error?: { message?: string };
}

function parseIsoDurationSeconds(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export async function fetchYoutube(): Promise<SourceResult> {
  const fetchedAt = new Date().toISOString();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return {
      source: "youtube",
      ok: false,
      error: "YOUTUBE_API_KEY manquante",
      signals: [],
      fetchedAt,
    };
  }

  try {
    const params = new URLSearchParams({
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      regionCode: "FR",
      maxResults: "25",
      key: apiKey,
    });
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      cache: "no-store",
    });
    const parsed: YoutubeResponse = await res.json();
    if (!res.ok) {
      throw new Error(parsed.error?.message ?? `YouTube HTTP ${res.status}`);
    }

    const signals: RawSignal[] = (parsed.items ?? [])
      .filter((item) => item.snippet?.title)
      .map((item) => {
        const seconds = parseIsoDurationSeconds(item.contentDetails?.duration);
        const isShort = seconds !== null && seconds <= 60;
        const parts: string[] = [];
        if (item.statistics?.viewCount) {
          parts.push(
            `${Number(item.statistics.viewCount).toLocaleString("fr-FR")} vues`
          );
        }
        parts.push(isShort ? "format court (Short)" : "format long");
        return {
          source: "youtube" as const,
          titre: item.snippet!.title!,
          metrique: parts.join(" · "),
          extrait: item.snippet?.channelTitle,
        };
      });

    return { source: "youtube", ok: true, signals, fetchedAt };
  } catch (err) {
    return {
      source: "youtube",
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
      signals: [],
      fetchedAt,
    };
  }
}
