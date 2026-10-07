import { Skeleton } from "@/components/ui/Skeleton";

export function TeacherResultSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64 sm:w-80" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 rounded-xl bg-card p-6 shadow-sm sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="flex gap-6 border-b border-gray-200 pb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Skeleton className="h-10 w-full max-w-xs rounded-xl" />
          <Skeleton className="hidden h-9 w-48 rounded-xl sm:block" />
        </div>
        <div className="space-y-3 border-t border-gray-100 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
