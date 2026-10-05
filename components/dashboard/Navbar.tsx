"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Sparkles, LogOut, Bell, Menu, X, Zap, ArrowLeft } from "lucide-react";

interface UserData {
  user_id: number;
  email: string;
  nama: string;
  role: string;
}

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate Quiz", href: "/generate", icon: Sparkles },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

interface NavbarProps {
  backHref?: string;
  backLabel?: string;
  fullWidth?: boolean; // Kept for backwards compatibility, though new design is already centered max-w-7xl
}

export function Navbar({ backHref, backLabel = "Kembali" }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-white font-sans">
        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Logo & Back Button */}
          <div className="flex flex-1 items-center justify-start">
            <Link href="/dashboard" className="flex items-center gap-2 mr-4">
              <Image
                src="/images/logo3.png"
                alt="Smartify Logo"
                width={120}
                height={40}
                priority
                className="h-7 w-auto"
              />
            </Link>
            
            {backHref && (
              <div className="hidden md:flex items-center border-l border-border pl-4">
                <Link
                  href={backHref}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation */}
          {!backHref && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            <button className="hidden md:flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
              <Zap className="h-4 w-4 fill-white" />
              <span>Upgrade Premium</span>
            </button>

            <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-text ring-2 ring-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                {user ? getInitials(user.nama) : "?"}
              </button>

              {userMenuOpen && user && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-white py-2 z-50">
                    <div className="px-4 pb-2 border-b border-border">
                      <p className="truncate text-sm font-bold text-foreground">{user.nama}</p>
                      <p className="truncate text-xs font-medium text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold text-danger-text transition-colors hover:bg-danger-subtle disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {loggingOut ? "Keluar..." : "Keluar"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2 text-muted-foreground hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-white border-l border-border px-6 py-6 font-sans flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Menu</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 text-muted-foreground hover:bg-gray-50 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-6 border-t border-border">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-sm font-bold text-white">
                <Zap className="h-4 w-4 fill-white" />
                Upgrade Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
