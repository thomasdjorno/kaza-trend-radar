import type { SourceResult, RawSignal } from "@/types/trend";

const URL = "https://www.reddit.com/r/france/hot.json?limit=25";

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

export async function fetchReddit(): Promise<SourceResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(URL, {
      headers: {
        "User-Agent": "KazaTrendRadar/1.0 (veille tendances Maison KAZA)",
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
