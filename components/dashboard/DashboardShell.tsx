"use client";

import { Navbar } from "@/components/dashboard/Navbar";
import { PageContainer } from "@/components/ui/PageContainer";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <Navbar />
      <main className="min-h-screen transition-all duration-300 pt-16">
        <PageContainer className="py-4 sm:py-6 md:py-8">{children}</PageContainer>
      </main>
    </div>
  );
}
