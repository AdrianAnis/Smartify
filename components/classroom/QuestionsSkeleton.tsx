import { Skeleton } from "@/components/ui/Skeleton";

export function QuestionsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 bg-white/90 px-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <span className="text-gray-300">/</span>
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <div className="mx-auto max-w-[1000px] px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="space-y-2 pt-2">
                {Array.from({ length: 4 }).map((_, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
