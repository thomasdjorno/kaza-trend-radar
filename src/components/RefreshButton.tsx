"use client";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "jamais";
  const date = new Date(iso);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RefreshButton({
  lastCollectedAt,
  loading,
  onRefresh,
}: {
  lastCollectedAt: string | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-kaza-ink-soft">
        Dernière collecte : {formatTimestamp(lastCollectedAt)}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-kaza-ink px-4 py-2 text-sm font-semibold hover:bg-kaza-ink hover:text-kaza-cream transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-kaza-ink"
      >
        <span
          className={`inline-block h-2 w-2 rounded-full bg-kaza-terracotta ${
            loading ? "animate-ping" : ""
          }`}
        />
        {loading ? "Rafraîchissement…" : "Rafraîchir"}
      </button>
    </div>
  );
}
