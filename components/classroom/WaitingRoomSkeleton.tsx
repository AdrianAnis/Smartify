import { Skeleton } from "@/components/ui/Skeleton";

export function WaitingRoomSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-8 w-64 sm:w-80" />
        </div>
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Column: Participants */}
        <div className="space-y-4">
          <div className="rounded-xl border-none bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Right Column: QR Code & Code */}
        <div className="space-y-4">
          <div className="rounded-xl border-none bg-card p-6 shadow-sm space-y-4 text-center">
            <div className="flex justify-center">
              <Skeleton className="h-52 w-52 rounded-xl" />
            </div>

            <div className="space-y-2 flex flex-col items-center">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-36" />
            </div>

            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="rounded-xl border-none bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
