import { Skeleton } from "@/components/ui/Skeleton";

export function TeacherMonitorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64 sm:w-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="ml-auto h-3 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 rounded-xl bg-card p-6 shadow-sm sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 py-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3 border-t border-gray-100 p-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
