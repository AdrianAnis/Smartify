import { Skeleton } from "@/components/ui/Skeleton";

export function FinishedQuizSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-gray-50/70 p-4 flex flex-col items-center justify-center text-center space-y-2"
              >
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-4 pb-1">
            <Skeleton className="h-8 w-40 rounded-xl" />
            <Skeleton className="h-8 w-36 rounded-xl" />
            <Skeleton className="h-8 w-44 rounded-xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>

        <div className="space-y-3 pt-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-20 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
