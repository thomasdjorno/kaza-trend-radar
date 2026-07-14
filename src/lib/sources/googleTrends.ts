import type { SourceResult, RawSignal } from "@/types/trend";

const URL = "https://trends.google.com/trending/rss?geo=FR";

function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.trim();
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
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    const signals: RawSignal[] = items
      .map((block) => ({
        source: "google_trends" as const,
        titre: extractTag(block, "title") ?? "",
        metrique: extractTag(block, "ht:approx_traffic"),
      }))
      .filter((signal) => signal.titre);

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
