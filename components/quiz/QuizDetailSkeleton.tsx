import { Skeleton } from "@/components/ui/Skeleton";

export function QuizDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Sticky Navbar Skeleton */}
      <div className="sticky top-0 z-50 flex h-16 items-center gap-4 bg-white/90 px-6 shadow-sm backdrop-blur-md">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-5 w-48" />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 mt-8 space-y-8">
        {/* Header / Page Title Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-64 sm:w-80" />
              <Skeleton className="h-6 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl self-end sm:self-auto" />
        </div>

        {/* Quiz Information Card (5 columns) */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-y-6 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* 3 Action Cards Grid Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
