"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TrendCollection } from "@/types/trend";
import ScoreBadge from "@/components/ScoreBadge";
import { sourceLabel } from "@/lib/sourceLabels";
import { SkeletonBlock } from "@/components/Skeleton";

interface HistoryDay {
  day: string;
  collections: TrendCollection[];
}

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoriquePage() {
  const [history, setHistory] = useState<HistoryDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trends/history")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        setHistory(data.history);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erreur inconnue")
      );
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-kaza-line bg-kaza-cream-deep/60">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-kaza-terracotta font-semibold mb-1">
              Maison KAZA
            </p>
            <h1 className="font-display text-3xl italic">Historique</h1>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-kaza-ink-soft hover:text-kaza-ink"
          >
            ← Retour au radar
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-10">
        {error && (
          <div className="rounded-xl border border-kaza-rouge/40 bg-kaza-rouge/5 text-kaza-rouge px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!history && !error && <SkeletonBlock lines={8} />}

        {history && history.length === 0 && (
          <p className="text-kaza-ink-soft text-sm">
            Aucune collecte enregistrée pour le moment.
          </p>
        )}

        {history?.map(({ day, collections }) => (
          <section key={day}>
            <h2 className="font-display text-xl italic mb-4 capitalize">
              {formatDay(day)}
            </h2>
            <div className="space-y-3">
              {collections
                .slice()
                .reverse()
                .map((c) => {
                  const top = c.trends
                    .slice()
                    .sort((a, b) => b.score_kaza - a.score_kaza)
                    .slice(0, 5);
                  return (
                    <div
                      key={c.collectedAt}
                      className="rounded-2xl border border-kaza-line bg-white/50 p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">
                          Collecte de {formatTime(c.collectedAt)}
                        </span>
                        <span className="text-xs text-kaza-ink-soft">
                          {c.trends.length} tendances analysées
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {top.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <ScoreBadge
                              score={t.score_kaza}
                              categorie={t.categorie}
                            />
                            <span className="truncate flex-1">{t.titre}</span>
                            <span className="text-xs text-kaza-ink-soft whitespace-nowrap">
                              {sourceLabel(t.source)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
