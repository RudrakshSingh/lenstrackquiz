export default function ShimmerCard() {
  return (
    <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl p-6 sm:p-7 relative" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.1)' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-32 animate-shimmer bg-[length:200%_100%]"></div>
          <div className="h-10 sm:h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl w-24 animate-shimmer bg-[length:200%_100%]"></div>
          <div className="h-5 sm:h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-40 animate-shimmer bg-[length:200%_100%]"></div>
        </div>
        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl animate-shimmer bg-[length:200%_100%]"></div>
      </div>
    </div>
  );
}

