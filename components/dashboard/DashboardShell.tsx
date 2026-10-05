"use client";

import { Navbar } from "@/components/dashboard/Navbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <Navbar />
      <main className="min-h-screen transition-all duration-300 pt-16">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
