import type { ScoredTrend } from "@/types/trend";
import TrendCard from "./TrendCard";
import EmptyState from "./EmptyState";
import { SkeletonCard } from "./Skeleton";

export default function HeroTop3({
  trends,
  loading,
  onSelect,
}: {
  trends: ScoredTrend[];
  loading: boolean;
  onSelect: (trend: ScoredTrend) => void;
}) {
  const top3 = trends
    .filter((t) => t.categorie === "surfer_maintenant")
    .sort((a, b) => b.score_kaza - a.score_kaza)
    .slice(0, 3);

  return (
    <section>
      <h2 className="font-display italic text-3xl mb-6">À surfer maintenant</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : top3.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {top3.map((trend, i) => (
            <TrendCard
              key={trend.id}
              trend={trend}
              index={i}
              onClick={() => onSelect(trend)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
