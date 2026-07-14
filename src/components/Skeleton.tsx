export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-kaza-line/70 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-kaza-line p-6 space-y-4">
      <SkeletonLine className="h-3 w-16" />
      <SkeletonLine className="h-6 w-4/5" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <SkeletonLine className="h-4 w-8" />
      <SkeletonLine className="h-4 flex-1" />
      <SkeletonLine className="h-4 w-20" />
      <SkeletonLine className="h-4 w-16" />
    </div>
  );
}

export function SkeletonBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i % 2 === 0 ? "w-full" : "w-4/5"}`} />
      ))}
    </div>
  );
}
