export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="h-3 w-28 rounded-full bg-slate-800" />
          <div className="mt-3 h-3 w-full rounded-full bg-slate-800" />
          <div className="mt-2 h-3 w-3/4 rounded-full bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
