import { NextResponse } from "next/server";
import { scoreTrends } from "@/lib/ai/scoring";
import { fetchAllSources } from "@/lib/pipeline";
import type { RawSignal } from "@/types/trend";

/**
 * Route de scoring autonome : envoie des signaux bruts à Claude et retourne
 * les tendances scorées. Si aucun signal n'est fourni dans le body, ré-agrège
 * les sources à la volée (utile pour tester le scoring isolément).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    let signals: RawSignal[] | undefined = body?.signals;

    if (!signals || signals.length === 0) {
      const sourceResults = await fetchAllSources();
      signals = sourceResults.flatMap((r) => r.signals);
    }

    const trends = await scoreTrends(signals);
    return NextResponse.json({ trends });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur de scoring IA" },
      { status: 500 }
    );
  }
}
