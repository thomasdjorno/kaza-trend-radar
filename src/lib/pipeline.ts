import { fetchGoogleTrends } from "@/lib/sources/googleTrends";
import { fetchReddit } from "@/lib/sources/reddit";
import { fetchYoutube } from "@/lib/sources/youtube";
import { fetchTiktok } from "@/lib/sources/tiktok";
import { scoreTrends } from "@/lib/ai/scoring";
import { readCache, writeCache, TREND_CACHE_TTL_MS } from "@/lib/cache";
import { appendHistory } from "@/lib/history";
import type { RawSignal, SourceResult, TrendCollection } from "@/types/trend";

const CACHE_KEY = "current-collection";

export async function fetchAllSources(): Promise<SourceResult[]> {
  const results = await Promise.allSettled([
    fetchGoogleTrends(),
    fetchReddit(),
    fetchYoutube(),
    fetchTiktok(),
  ]);

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const sources = ["google_trends", "reddit", "youtube", "tiktok"] as const;
    return {
      source: sources[i],
      ok: false,
      error: r.reason instanceof Error ? r.reason.message : "Erreur inconnue",
      signals: [],
      fetchedAt: new Date().toISOString(),
    };
  });
}

function toSourcesStatus(results: SourceResult[]): TrendCollection["sources"] {
  const status = {} as TrendCollection["sources"];
  for (const r of results) {
    status[r.source] = { ok: r.ok, error: r.error, count: r.signals.length };
  }
  return status;
}

export async function runCollection(
  force = false
): Promise<TrendCollection> {
  if (!force) {
    const cached = await readCache<TrendCollection>(
      CACHE_KEY,
      TREND_CACHE_TTL_MS
    );
    if (cached) return cached;
  }

  const sourceResults = await fetchAllSources();
  const signals: RawSignal[] = sourceResults.flatMap((r) => r.signals);

  let trends: TrendCollection["trends"] = [];
  let scoringError: string | undefined;
  try {
    trends = await scoreTrends(signals);
  } catch (err) {
    scoringError = err instanceof Error ? err.message : "Erreur de scoring IA";
  }

  const collection: TrendCollection = {
    collectedAt: new Date().toISOString(),
    sources: toSourcesStatus(sourceResults),
    trends,
    scoringError,
  };

  await writeCache(CACHE_KEY, collection);
  if (trends.length > 0) {
    await appendHistory(collection);
  }

  return collection;
}
