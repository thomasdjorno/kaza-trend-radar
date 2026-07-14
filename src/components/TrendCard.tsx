import type { ScoredTrend } from "@/types/trend";
import ScoreBadge from "./ScoreBadge";
import RiskBadge from "./RiskBadge";
import TypeBadge from "./TypeBadge";
import { sourceLabel } from "@/lib/sourceLabels";

export default function TrendCard({
  trend,
  index,
  onClick,
}: {
  trend: ScoredTrend;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left flex flex-col justify-between rounded-3xl border border-kaza-line bg-white/70 p-8 min-h-[320px] overflow-hidden transition-all hover:border-kaza-ink hover:-translate-y-1 hover:shadow-lg"
    >
      <span className="pointer-events-none absolute -top-6 -right-2 font-display font-extrabold text-[9rem] leading-none text-kaza-ink/[0.06] select-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-kaza-terracotta">
              {sourceLabel(trend.source)}
            </span>
            <TypeBadge type={trend.type_tendance} />
          </div>
          <ScoreBadge score={trend.score_kaza} categorie={trend.categorie} />
        </div>
        <h3 className="font-display font-bold text-2xl leading-snug mb-3 group-hover:text-kaza-rouge transition-colors">
          {trend.titre}
        </h3>
        <p className="text-sm text-kaza-ink-soft leading-relaxed">
          {trend.resume}
        </p>
      </div>

      <div className="relative mt-6 pt-6 border-t border-kaza-line">
        <p className="text-sm font-medium mb-3">{trend.angle_kaza}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-kaza-ink-soft">
            Fenêtre : {trend.fenetre}
          </span>
          <RiskBadge risque={trend.risque} />
        </div>
      </div>
    </button>
  );
}
