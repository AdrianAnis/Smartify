"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

interface UserData {
  user_id: number;
  email: string;
  nama: string;
  role: string;
}

interface NavbarProps {
  onOpenMobileNav?: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function Navbar({ onOpenMobileNav }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 401) {
          router.replace("/auth/login");
        }
      } catch (err) {
        console.error("Load user error:", err);
      }
    };
    void loadUser();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/auth/login");
      router.refresh();
    }
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-40 h-16 border-b border-border bg-card shadow-sm md:left-64">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center">
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="shrink-0 rounded-lg p-2 text-foreground hover:bg-input md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu akun"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-border transition-colors hover:border-primary"
          >
            <span className="flex h-full w-full items-center justify-center bg-primary text-sm font-medium text-white">
              {user ? getInitials(user.nama) : "?"}
            </span>
          </button>

          {menuOpen && user && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1 shadow-lg">
                <div className="border-b border-border px-4 py-2">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {user.nama}
                  </p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger-strong transition-colors hover:bg-input disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Keluar..." : "Keluar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
