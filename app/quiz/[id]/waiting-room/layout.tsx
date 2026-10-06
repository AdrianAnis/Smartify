import { Navbar } from "@/components/dashboard/Navbar";
import { PageContainer } from "@/components/ui/PageContainer";

export default function WaitingRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar fullWidth backHref="/dashboard" />
      <main className="pt-16">
        <PageContainer className="py-8">{children}</PageContainer>
      </main>
    </div>
  );
}
