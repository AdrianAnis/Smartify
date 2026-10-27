"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Sparkles, LogOut, Menu, X, Crown, ArrowLeft, CreditCard } from "lucide-react";
import { PremiumModal } from "@/components/premium/PremiumModal";

interface UserData {
  user_id: number;
  email: string;
  nama: string;
  role: string;
  subscription_status?: string;
  expired_at?: string;
}

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Generate Quiz", href: "/generate", icon: Sparkles, exact: false },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard, exact: false },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

interface NavbarProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export function Navbar({ backHref, backLabel = "Kembali", title }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const openPremiumModal = () => {
    setMobileNavOpen(false);
    setPremiumModalOpen(true);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
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

  const isItemActive = (item: (typeof menuItems)[number]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(item.href + "/");

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white font-sans">
        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <div className="flex flex-1 items-center justify-start gap-4">
            {backHref && (
              <Link
                href={backHref}
                className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                title={backLabel}
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
            )}

            {title ? (
              <h1 className="text-base md:text-lg font-bold text-foreground">
                {title}
              </h1>
            ) : (
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/logo_smartify.svg"
                  alt="Smartify Logo"
                  width={120}
                  height={29}
                  priority
                  className="h-7 w-auto"
                />
              </Link>
            )}
          </div>

          {!backHref && !title && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
              {menuItems.map((item) => {
                const isActive = isItemActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
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

          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            <button
              onClick={openPremiumModal}
              className="hidden md:flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-1.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            >
              {user?.subscription_status === 'premium' && user?.expired_at && new Date(user.expired_at) > new Date() ? (
                <>
                  <Crown className="h-4 w-4 text-white" />
                  <span className="text-white">Premium</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="text-white">Upgrade</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                {user ? getInitials(user.nama) : "?"}
              </button>

              {userMenuOpen && user && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white py-2 z-50">
                    <div className="px-4 pb-2">
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
              className="md:hidden p-2 text-muted-foreground hover:bg-gray-50 rounded-xl"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-white px-6 py-6 font-sans flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Menu</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 text-muted-foreground hover:bg-gray-50 rounded-xl">
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
            <div className="pt-6 ">
              <button
                onClick={openPremiumModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              >
                {user?.subscription_status === 'premium' && user?.expired_at && new Date(user.expired_at) > new Date() ? (
                  <>
                    <Crown className="h-4 w-4 text-white" />
                    Premium
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white" />
                    Upgrade Premium
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        currentPlan={user?.subscription_status === 'premium' && user?.expired_at && new Date(user.expired_at) > new Date() ? "premium" : "free"}
        expiredAt={user?.expired_at}
      />
    </>
  );
}
