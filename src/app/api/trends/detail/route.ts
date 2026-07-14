import { NextResponse } from "next/server";
import { generateTrendDetail } from "@/lib/ai/detail";
import { readCache, writeCache } from "@/lib/cache";
import type { ScoredTrend, TrendDetail } from "@/types/trend";

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

    const cacheKey = `detail-${trend.id}`;
    const cached = await readCache<TrendDetail>(cacheKey, THIRTY_DAYS_MS);
    if (cached) return NextResponse.json(cached);

    const generated = await generateTrendDetail(trend);
    const detail: TrendDetail = {
      id: trend.id,
      generatedAt: new Date().toISOString(),
      ...generated,
    };

    await writeCache(cacheKey, detail);
    return NextResponse.json(detail);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de l'analyse",
      },
      { status: 500 }
    );
  }
}
