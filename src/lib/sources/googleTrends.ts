import type { SourceResult, RawSignal } from "@/types/trend";

const URL =
  "https://trends.google.com/trends/api/dailytrends?hl=fr&geo=FR&ns=15";

interface GoogleTrendItem {
  title?: { query?: string };
  formattedTraffic?: string;
  articles?: Array<{ title?: string }>;
}

interface GoogleTrendDay {
  trendingSearchesDays?: Array<{
    trendingSearches?: GoogleTrendItem[];
  }>;
}

export async function fetchGoogleTrends(): Promise<SourceResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KazaTrendRadar/1.0)" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Google Trends HTTP ${res.status}`);
    }
    const raw = await res.text();
    const cleaned = raw.replace(/^\)\]\}',?\n?/, "");
    const parsed: GoogleTrendDay = JSON.parse(cleaned);

    const items =
      parsed.trendingSearchesDays?.flatMap(
        (day) => day.trendingSearches ?? []
      ) ?? [];

    const signals: RawSignal[] = items
      .filter((item) => item.title?.query)
      .map((item) => ({
        source: "google_trends" as const,
        titre: item.title!.query!,
        metrique: item.formattedTraffic ?? undefined,
        extrait: item.articles?.[0]?.title ?? undefined,
      }));

    return { source: "google_trends", ok: true, signals, fetchedAt };
  } catch (err) {
    return {
      source: "google_trends",
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
      signals: [],
      fetchedAt,
    };
  }
}
