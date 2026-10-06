import { Skeleton } from "@/components/ui/Skeleton";

export function WaitingRoomSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-6 h-72 w-full rounded-xl" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-56" />
            </div>
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
          <div className="mt-6 flex min-h-[320px] flex-wrap content-start gap-3 rounded-xl bg-gray-50 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-36 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
