"use client";

import { useEffect, useState } from "react";
import type { ScoredTrend, TrendDetail, VideoPrompts } from "@/types/trend";
import ScoreBadge from "./ScoreBadge";
import RiskBadge from "./RiskBadge";
import TypeBadge from "./TypeBadge";
import CopyButton from "./CopyButton";
import { SkeletonBlock } from "./Skeleton";
import { sourceLabel } from "@/lib/sourceLabels";

const NIVEAU_LABEL: Record<string, string> = {
  sur: "Sûr",
  modere: "Modéré",
  audacieux: "Audacieux",
};

export default function TrendDrawer({
  trend,
  onClose,
}: {
  trend: ScoredTrend | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<TrendDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [videoPrompts, setVideoPrompts] = useState<VideoPrompts | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset à chaque changement de tendance sélectionnée
    setDetail(null);
    setDetailError(null);
    setVideoPrompts(null);
    setVideoError(null);

    if (!trend) return;

    let cancelled = false;
    setDetailLoading(true);
    fetch("/api/trends/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trend }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled)
          setDetailError(err instanceof Error ? err.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trend]);

  async function handleGenerateVideoPrompts() {
    if (!trend) return;
    setVideoLoading(true);
    setVideoError(null);
    try {
      const res = await fetch("/api/trends/video-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setVideoPrompts(data);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setVideoLoading(false);
    }
  }

  const open = Boolean(trend);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-kaza-ink/30 backdrop-blur-sm z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-kaza-cream border-l border-kaza-line z-50 overflow-y-auto kaza-scrollbar transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {trend && (
          <div className="p-6 sm:p-8">
            <button
              type="button"
              onClick={onClose}
              className="mb-6 text-sm text-kaza-ink-soft hover:text-kaza-ink"
            >
              ← Fermer
            </button>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-widest text-kaza-terracotta">
                {sourceLabel(trend.source)}
              </span>
              <TypeBadge type={trend.type_tendance} />
              <ScoreBadge score={trend.score_kaza} categorie={trend.categorie} />
              <RiskBadge risque={trend.risque} />
            </div>

            <h2 className="font-display font-bold text-3xl leading-tight mb-2">
              {trend.titre}
            </h2>
            <p className="text-sm text-kaza-ink-soft mb-8">
              {trend.volume} · Fenêtre {trend.fenetre}
            </p>

            {detailLoading && <SkeletonBlock lines={6} />}
            {detailError && (
              <p className="text-sm text-kaza-rouge">{detailError}</p>
            )}

            {detail && (
              <div className="space-y-8">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-kaza-ink-soft mb-2">
                    Décryptage
                  </h3>
                  <p className="text-sm leading-relaxed">{detail.decryptage}</p>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-kaza-ink-soft mb-3">
                    Angles de contenu
                  </h3>
                  <div className="space-y-3">
                    {detail.angles.map((a, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-kaza-line p-4 bg-white/60"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-kaza-terracotta">
                            {NIVEAU_LABEL[a.niveau] ?? a.niveau}
                          </span>
                          <CopyButton text={a.hook} />
                        </div>
                        <p className="text-sm font-medium mb-1">{a.angle}</p>
                        <p className="text-sm italic text-kaza-ink-soft">
                          « {a.hook} »
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-kaza-ink-soft mb-2">
                    Produits KAZA associés
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.produits_kaza.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-kaza-ink text-kaza-cream text-xs font-medium px-3 py-1"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-kaza-ink-soft mb-2">
                    Pièges à éviter
                  </h3>
                  <ul className="space-y-1.5">
                    {detail.pieges.map((p, i) => (
                      <li
                        key={i}
                        className="text-sm text-kaza-ink-soft flex gap-2"
                      >
                        <span className="text-kaza-rouge">–</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="pt-4 border-t border-kaza-line">
                  {!videoPrompts && (
                    <button
                      type="button"
                      onClick={handleGenerateVideoPrompts}
                      disabled={videoLoading}
                      className="w-full rounded-lg bg-kaza-rouge text-white font-medium py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {videoLoading
                        ? "Génération…"
                        : "Générer les prompts vidéo"}
                    </button>
                  )}
                  {videoError && (
                    <p className="mt-2 text-sm text-kaza-rouge">{videoError}</p>
                  )}
                  {videoLoading && (
                    <div className="mt-4">
                      <SkeletonBlock lines={5} />
                    </div>
                  )}

                  {videoPrompts && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-kaza-line p-4 bg-white/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-kaza-ink-soft">
                            Prompt vidéo IA (Sora)
                          </span>
                          <CopyButton text={videoPrompts.sora_prompt} />
                        </div>
                        <p className="text-sm leading-relaxed">
                          {videoPrompts.sora_prompt}
                        </p>
                      </div>

                      <div className="rounded-xl border border-kaza-line p-4 bg-white/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-kaza-ink-soft">
                            Script de Reel
                          </span>
                          <CopyButton
                            text={[
                              `Hook : ${videoPrompts.reel_script.hook}`,
                              ...videoPrompts.reel_script.plans,
                              `Texte à l'écran : ${videoPrompts.reel_script.texte_ecran.join(" / ")}`,
                              `Audio : ${videoPrompts.reel_script.audio_suggestion}`,
                            ].join("\n")}
                          />
                        </div>
                        <p className="text-sm font-medium mb-2">
                          {videoPrompts.reel_script.hook}
                        </p>
                        <ol className="text-sm text-kaza-ink-soft list-decimal list-inside space-y-1 mb-2">
                          {videoPrompts.reel_script.plans.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ol>
                        <p className="text-xs text-kaza-ink-soft">
                          Texte écran : {videoPrompts.reel_script.texte_ecran.join(" · ")}
                        </p>
                        <p className="text-xs text-kaza-ink-soft mt-1">
                          Audio : {videoPrompts.reel_script.audio_suggestion}
                        </p>
                      </div>

                      <div className="rounded-xl border border-kaza-line p-4 bg-white/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-kaza-ink-soft">
                            Caption Instagram
                          </span>
                          <CopyButton
                            text={`${videoPrompts.caption.texte}\n\n${videoPrompts.caption.hashtags.join(" ")}`}
                          />
                        </div>
                        <p className="text-sm mb-2">{videoPrompts.caption.texte}</p>
                        <p className="text-xs text-kaza-terracotta">
                          {videoPrompts.caption.hashtags.join(" ")}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
