import type { Categorie } from "@/types/trend";

const STYLES: Record<Categorie, string> = {
  surfer_maintenant: "bg-kaza-vert text-white",
  a_surveiller: "bg-kaza-ocre text-white",
  ignorer: "bg-kaza-ink-soft/20 text-kaza-ink-soft",
};

export default function ScoreBadge({
  score,
  categorie,
}: {
  score: number;
  categorie: Categorie;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${STYLES[categorie]}`}
    >
      {score}
    </span>
  );
}
