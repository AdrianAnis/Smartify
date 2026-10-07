import { Navbar } from "@/components/dashboard/Navbar";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function ResultLayout({ children, params }: LayoutProps<"/quiz/[id]/result">) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <Navbar backHref={`/quiz/${id}`} />
      <main className="pt-16">
        <PageContainer className="py-8">{children}</PageContainer>
      </main>
    </div>
  );
}
