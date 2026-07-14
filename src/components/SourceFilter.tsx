"use client";

import type { Categorie, SourceName } from "@/types/trend";
import { SOURCE_LABELS } from "@/lib/sourceLabels";

const CATEGORIES: Array<{ value: Categorie | "all"; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "surfer_maintenant", label: "Surfer maintenant" },
  { value: "a_surveiller", label: "À surveiller" },
  { value: "ignorer", label: "Ignorer" },
];

const SOURCES: Array<{ value: SourceName | "all"; label: string }> = [
  { value: "all", label: "Toutes sources" },
  ...(Object.keys(SOURCE_LABELS) as SourceName[]).map((s) => ({
    value: s,
    label: SOURCE_LABELS[s],
  })),
];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors whitespace-nowrap ${
        active
          ? "bg-kaza-ink text-kaza-cream border-kaza-ink"
          : "border-kaza-line text-kaza-ink-soft hover:border-kaza-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function SourceFilter({
  categorie,
  onCategorieChange,
  source,
  onSourceChange,
}: {
  categorie: Categorie | "all";
  onCategorieChange: (c: Categorie | "all") => void;
  source: SourceName | "all";
  onSourceChange: (s: SourceName | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto kaza-scrollbar pb-1">
        {CATEGORIES.map((c) => (
          <Pill
            key={c.value}
            active={categorie === c.value}
            onClick={() => onCategorieChange(c.value)}
          >
            {c.label}
          </Pill>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto kaza-scrollbar pb-1">
        {SOURCES.map((s) => (
          <Pill
            key={s.value}
            active={source === s.value}
            onClick={() => onSourceChange(s.value)}
          >
            {s.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}
