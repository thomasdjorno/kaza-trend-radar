import { NextResponse } from "next/server";
import { generateVideoPrompts } from "@/lib/ai/videoPrompts";
import { readCache, writeCache } from "@/lib/cache";
import type { ScoredTrend, VideoPrompts } from "@/types/trend";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const trend: ScoredTrend | undefined = body?.trend;
    if (!trend?.id) {
      return NextResponse.json(
        { error: "Tendance manquante ou invalide" },
        { status: 400 }
      );
    }

    const cacheKey = `video-${trend.id}`;
    const cached = await readCache<VideoPrompts>(cacheKey, THIRTY_DAYS_MS);
    if (cached) return NextResponse.json(cached);

    const generated = await generateVideoPrompts(trend);
    const prompts: VideoPrompts = {
      id: trend.id,
      generatedAt: new Date().toISOString(),
      ...generated,
    };

    await writeCache(cacheKey, prompts);
    return NextResponse.json(prompts);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erreur lors de la génération des prompts",
      },
      { status: 500 }
    );
  }
}
