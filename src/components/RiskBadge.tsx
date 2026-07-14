import type { Risque } from "@/types/trend";

const STYLES: Record<Risque, string> = {
  faible: "border-kaza-vert text-kaza-vert",
  moyen: "border-kaza-ocre text-kaza-ocre",
  eleve: "border-kaza-rouge text-kaza-rouge",
};

const LABELS: Record<Risque, string> = {
  faible: "Risque faible",
  moyen: "Risque moyen",
  eleve: "Risque élevé",
};

export default function RiskBadge({ risque }: { risque: Risque }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[risque]}`}
    >
      {LABELS[risque]}
    </span>
  );
}
