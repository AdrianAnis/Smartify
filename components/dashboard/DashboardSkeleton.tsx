import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <Skeleton className="mb-2 h-3.5 w-24" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-8 w-56 sm:w-64" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-11 w-full rounded-xl sm:w-80" />
            <Skeleton className="h-11 w-full rounded-xl sm:w-28" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="h-1.5 bg-gray-200/90" />
            <div className="p-4 sm:p-5">
              <div className="mb-3">
                <Skeleton className="h-5 w-20 rounded-xl" />
              </div>
              <Skeleton className="mb-2 h-5 w-5/6" />
              <Skeleton className="mb-4 h-5 w-2/3" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
