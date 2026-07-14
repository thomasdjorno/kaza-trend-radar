"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Categorie, ScoredTrend, SourceName, TrendCollection } from "@/types/trend";
import KazaLogo from "@/components/KazaLogo";
import HeroTop3 from "@/components/HeroTop3";
import TrendListRow from "@/components/TrendListRow";
import TrendDrawer from "@/components/TrendDrawer";
import RefreshButton from "@/components/RefreshButton";
import SourceFilter from "@/components/SourceFilter";
import SourceStatusBar from "@/components/SourceStatusBar";
import { SkeletonRow } from "@/components/Skeleton";

export default function Home() {
  const [collection, setCollection] = useState<TrendCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScoredTrend | null>(null);
  const [categorie, setCategorie] = useState<Categorie | "all">("all");
  const [source, setSource] = useState<SourceName | "all">("all");

  async function load(force = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trends/collect${force ? "?force=true" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setCollection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial côté client
    load(false);
  }, []);

  const filtered = useMemo(() => {
    if (!collection) return [];
    return collection.trends
      .filter((t) => categorie === "all" || t.categorie === categorie)
      .filter((t) => source === "all" || t.source === source)
      .sort((a, b) => b.score_kaza - a.score_kaza);
  }, [collection, categorie, source]);

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-kaza-line bg-kaza-cream-deep/60">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <KazaLogo className="h-11" />
            <div className="h-8 w-px bg-kaza-line" />
            <h1 className="font-display font-bold text-2xl">Trend Radar</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/historique"
              className="text-sm font-medium text-kaza-ink-soft hover:text-kaza-ink"
            >
              Historique
            </Link>
            <RefreshButton
              lastCollectedAt={collection?.collectedAt ?? null}
              loading={loading}
              onRefresh={() => load(true)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-12">
        {error && (
          <div className="rounded-xl border border-kaza-rouge/40 bg-kaza-rouge/5 text-kaza-rouge px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {collection?.scoringError && (
          <div className="rounded-xl border border-kaza-ocre/40 bg-kaza-ocre/10 text-kaza-ocre px-4 py-3 text-sm">
            Scoring IA indisponible : {collection.scoringError}
          </div>
        )}

        {collection && <SourceStatusBar sources={collection.sources} />}

        <HeroTop3
          trends={collection?.trends ?? []}
          loading={loading && !collection}
          onSelect={setSelected}
        />

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="font-display font-bold text-3xl">Classement complet</h2>
            <SourceFilter
              categorie={categorie}
              onCategorieChange={setCategorie}
              source={source}
              onSourceChange={setSource}
            />
          </div>

          <div className="rounded-2xl border border-kaza-line bg-white/50 px-4">
            {loading && !collection ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-kaza-ink-soft text-sm">
                Aucune tendance ne correspond à ces filtres.
              </p>
            ) : (
              filtered.map((trend) => (
                <TrendListRow
                  key={trend.id}
                  trend={trend}
                  onClick={() => setSelected(trend)}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <TrendDrawer trend={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
