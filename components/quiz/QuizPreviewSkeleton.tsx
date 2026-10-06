import { Skeleton } from "@/components/ui/Skeleton";

export function QuizPreviewSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Header Info Card Skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-36" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-64 sm:w-80" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-44" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>

        {/* 6 Info Boxes */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <Skeleton className="mb-2 h-3 w-16" />
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topics Distribution Card */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <Skeleton className="mb-2 h-5 w-32" />
        <Skeleton className="mb-4 h-4 w-72" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-10 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-gray-100 pb-8 last:border-b-0 last:pb-0"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-20" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-xl" />
                <Skeleton className="h-7 w-7 rounded-xl" />
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* 4 Choices */}
            <div className="mb-6 space-y-3">
              {Array.from({ length: 4 }).map((_, optIdx) => (
                <div
                  key={optIdx}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>

            {/* Answer Explanation */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <Skeleton className="mb-2 h-4 w-28" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
