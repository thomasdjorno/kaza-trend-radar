import type { SourceResult, RawSignal } from "@/types/trend";

const BASE_URL = "https://www.googleapis.com/youtube/v3/videos";

interface YoutubeItem {
  snippet?: { title?: string; channelTitle?: string };
  statistics?: { viewCount?: string };
}

interface YoutubeResponse {
  items?: YoutubeItem[];
  error?: { message?: string };
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
      part: "snippet,statistics",
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
      .map((item) => ({
        source: "youtube" as const,
        titre: item.snippet!.title!,
        metrique: item.statistics?.viewCount
          ? `${Number(item.statistics.viewCount).toLocaleString("fr-FR")} vues`
          : undefined,
        extrait: item.snippet?.channelTitle,
      }));

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
