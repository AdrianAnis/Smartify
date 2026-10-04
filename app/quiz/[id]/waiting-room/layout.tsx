import { Navbar } from "@/components/dashboard/Navbar";

export default function WaitingRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar fullWidth backHref="/dashboard" />
      <main className="pt-24 pb-16">{children}</main>
    </div>
  );
}
