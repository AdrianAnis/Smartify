import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/PageContainer";

export function QuizDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 top-0 z-40 h-16 bg-card" />

      <main className="pt-16">
        <PageContainer className="py-8">
          <section className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-72" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-gray-100 pt-6 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-5 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
                <Skeleton className="h-12 w-48 rounded-xl" />
              </div>
            </section>

            <aside className="space-y-3 self-start rounded-xl bg-card p-3 shadow-sm">
              <Skeleton className="h-[76px] w-full rounded-xl" />
              <Skeleton className="h-[76px] w-full rounded-xl" />
            </aside>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
