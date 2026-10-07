import { Navbar } from "@/components/dashboard/Navbar";
import { PageContainer } from "@/components/ui/PageContainer";

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar backHref="/dashboard" />
      <main className="pt-16">
        <PageContainer className="py-8">{children}</PageContainer>
      </main>
    </div>
  );
}
