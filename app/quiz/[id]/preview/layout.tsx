import { Navbar } from "@/components/dashboard/Navbar";

export default function QuizPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar fullWidth backHref="/dashboard" />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
