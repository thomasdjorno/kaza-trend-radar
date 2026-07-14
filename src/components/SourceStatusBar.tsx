import type { TrendCollection } from "@/types/trend";
import { SOURCE_LABELS } from "@/lib/sourceLabels";

export default function SourceStatusBar({
  sources,
}: {
  sources: TrendCollection["sources"];
}) {
  const entries = Object.entries(sources) as Array<
    [keyof typeof sources, TrendCollection["sources"][keyof typeof sources]]
  >;

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, status]) => (
        <span
          key={key}
          title={status.error}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
            status.ok
              ? "border-kaza-line text-kaza-ink-soft"
              : "border-kaza-rouge/40 bg-kaza-rouge/5 text-kaza-rouge"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status.ok ? "bg-kaza-vert" : "bg-kaza-rouge"
            }`}
          />
          {SOURCE_LABELS[key]}
          {status.ok ? ` · ${status.count}` : " · indisponible"}
        </span>
      ))}
    </div>
  );
}
