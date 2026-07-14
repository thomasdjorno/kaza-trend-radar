import type { ScoredTrend } from "@/types/trend";
import ScoreBadge from "./ScoreBadge";
import { sourceLabel } from "@/lib/sourceLabels";

const CATEGORIE_LABEL: Record<ScoredTrend["categorie"], string> = {
  surfer_maintenant: "Surfer",
  a_surveiller: "À surveiller",
  ignorer: "Ignorer",
};

export default function TrendListRow({
  trend,
  onClick,
}: {
  trend: ScoredTrend;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3.5 px-4 -mx-4 rounded-xl text-left hover:bg-white/70 transition-colors border-b border-kaza-line last:border-b-0"
    >
      <ScoreBadge score={trend.score_kaza} categorie={trend.categorie} />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{trend.titre}</p>
        <p className="text-xs text-kaza-ink-soft truncate">
          {trend.angle_kaza}
        </p>
      </div>
      <span className="hidden sm:inline text-xs text-kaza-ink-soft whitespace-nowrap">
        {sourceLabel(trend.source)}
      </span>
      <span className="hidden md:inline text-xs text-kaza-ink-soft whitespace-nowrap w-24">
        {CATEGORIE_LABEL[trend.categorie]}
      </span>
      <span className="hidden lg:inline text-xs text-kaza-ink-soft whitespace-nowrap w-16">
        {trend.fenetre}
      </span>
    </button>
  );
}
