function LoadingSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
      <div className="h-4 w-2/5 animate-pulse rounded bg-slate-700" />
      <div className="h-10 w-full animate-pulse rounded bg-slate-800" />
      <div className="h-10 w-full animate-pulse rounded bg-slate-800" />
      <div className="h-10 w-4/5 animate-pulse rounded bg-slate-800" />
    </div>
  );
}

export default LoadingSkeleton;
