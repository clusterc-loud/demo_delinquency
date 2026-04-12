/**
 * SkeletonLoader — Shimmer placeholder
 * Props: { rows?: number, type?: 'table' | 'card' | 'chart' | 'list' }
 */
export default function SkeletonLoader({ rows = 4, type = 'card' }) {
  if (type === 'table') {
    return (
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-[#eaf7eb]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 shimmer rounded-full" />
          ))}
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-6 py-5 border-b border-[#e4f1e5]">
            {[...Array(6)].map((_, j) => (
              <div
                key={j}
                className="shimmer rounded-full"
                style={{ height: '12px', opacity: j === 0 ? 1 : 0.7 }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white rounded-xl p-6 space-y-4">
        <div className="h-4 w-48 shimmer rounded-full" />
        <div className="h-3 w-32 shimmer rounded-full opacity-60" />
        <div className="h-48 w-full shimmer rounded-xl mt-4" />
        <div className="flex gap-4 mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 flex-1 shimmer rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 shimmer rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 shimmer rounded-full" />
              <div className="h-2 w-1/2 shimmer rounded-full opacity-60" />
            </div>
            <div className="h-5 w-16 shimmer rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-3 w-32 shimmer rounded-full" />
            <div className="h-5 w-12 shimmer rounded-full" />
          </div>
          <div className="h-8 w-24 shimmer rounded-full" />
          <div className="h-8 w-full shimmer rounded-lg" />
        </div>
      ))}
    </div>
  );
}
