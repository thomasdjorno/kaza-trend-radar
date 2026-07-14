import type { TypeTendance } from "@/types/trend";

const LABELS: Record<TypeTendance, string> = {
  actualite: "Actu",
  format_viral: "Format viral",
  musique_son: "Son qui buzz",
  produit_objet: "Objet viral",
  autre: "Autre",
};

const STYLES: Record<TypeTendance, string> = {
  actualite: "bg-kaza-tan/60 text-kaza-ink-soft",
  format_viral: "bg-kaza-rouge/10 text-kaza-rouge",
  musique_son: "bg-kaza-ocre/15 text-kaza-ocre",
  produit_objet: "bg-kaza-vert/15 text-kaza-vert",
  autre: "bg-kaza-tan/60 text-kaza-ink-soft",
};

export default function TypeBadge({ type }: { type: TypeTendance }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
