export function TripCardSkeleton() {
  return (
    <div className="silicon-glass animate-pulse">
      <div className="w-20 h-20 bg-white/5 rounded-2xl mb-8" />
      <div className="h-12 bg-white/5 rounded-xl mb-4 w-3/4" />
      <div className="h-6 bg-white/5 rounded-xl mb-8 w-1/2" />
      <div className="flex gap-3 mt-auto">
        {[1,2,3].map(i => <div key={i} className="w-12 h-12 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  );
}

export function ExpenseRowSkeleton() {
  return (
    <div className="px-10 py-10 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-8">
        <div className="w-20 h-20 bg-white/5 rounded-2xl" />
        <div>
          <div className="h-8 bg-white/5 rounded-xl w-48 mb-3" />
          <div className="h-4 bg-white/5 rounded-xl w-32" />
        </div>
      </div>
      <div className="h-10 bg-white/5 rounded-xl w-24" />
    </div>
  );
}
