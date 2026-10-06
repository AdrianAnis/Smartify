"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Sparkles, LogOut, Bell, Menu, X, Zap, Crown, ArrowLeft } from "lucide-react";
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
  title?: string;
  fullWidth?: boolean; // Kept for backwards compatibility, though new design is already centered max-w-7xl
}

export function Navbar({ backHref, backLabel = "Kembali", title }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number; remaining: number; isPremium: boolean; expiredAt?: string } | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  // Notifications State
  interface AppNotification {
    id: string;
    type: 'premium_alert' | 'premium_status' | 'free_status' | 'quota';
    title: string;
    content: React.ReactNode;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    iconColorClass: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }

  const [readNotifs, setReadNotifs] = useState<string[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const [activeNotifs, setActiveNotifs] = useState<AppNotification[]>([]);

  // Load from local storage
  useEffect(() => {
    try {
      const read = localStorage.getItem('smartify_read_notifs');
      if (read) setReadNotifs(JSON.parse(read));
      
      const dismissed = localStorage.getItem('smartify_dismissed_notifs');
      if (dismissed) setDismissedNotifs(JSON.parse(dismissed));
    } catch(e) {}
  }, []);

  // Fetch quota when user is loaded
  useEffect(() => {
    if (user) {
      setQuotaLoading(true);
      fetch("/api/user/quota")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setQuotaInfo(data);
          setQuotaLoading(false);
        })
        .catch(() => setQuotaLoading(false));
    }
  }, [user]);

  // Generate notifications
  useEffect(() => {
    if (!quotaInfo) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newNotifs: AppNotification[] = [];

    if (quotaInfo.isPremium) {
      const expiryDate = quotaInfo.expiredAt ? new Date(quotaInfo.expiredAt) : new Date();
      const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 3) {
        newNotifs.push({
          id: `premium_expiring_${todayStr}`,
          type: 'premium_alert',
          title: 'Premium Segera Habis!',
          content: (
            <p className="text-[11px] text-amber-800 leading-relaxed mb-2">
              Masa aktif Anda tersisa <strong>{daysRemaining} hari</strong>. Perpanjang sekarang agar batas soal harian tidak kembali ke 20 soal/hari.
            </p>
          ),
          icon: Crown,
          colorClass: 'border-amber-200',
          bgClass: 'bg-amber-50',
          iconColorClass: 'text-amber-600',
          action: {
            label: 'Perpanjang Sekarang',
            onClick: () => setPremiumModalOpen(true)
          }
        });
      } else {
        newNotifs.push({
          id: `premium_active_${todayStr}`,
          type: 'premium_status',
          title: 'Status Premium Aktif',
          content: (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Nikmati akses penuh ke semua jenis soal. Masa aktif Anda tersisa <strong>{daysRemaining} hari</strong>.
            </p>
          ),
          icon: Crown,
          colorClass: 'border-primary/20',
          bgClass: 'bg-primary/5',
          iconColorClass: 'text-primary'
        });
      }
    } else {
      newNotifs.push({
        id: `free_plan_${todayStr}`,
        type: 'free_status',
        title: 'Status Free Plan',
        content: (
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
            Anda sedang menggunakan paket gratis. Upgrade untuk batas soal yang lebih tinggi dan akses semua jenis kuis.
          </p>
        ),
        icon: Sparkles,
        colorClass: 'border-gray-200',
        bgClass: 'bg-gray-50',
        iconColorClass: 'text-gray-600',
        action: {
          label: 'Lihat Penawaran Premium',
          onClick: () => setPremiumModalOpen(true)
        }
      });
    }

    newNotifs.push({
      id: `quota_${todayStr}`,
      type: 'quota',
      title: 'Limit Buat Soal Hari Ini',
      content: (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-foreground">Sisa Limit</span>
            <span className="text-[11px] font-bold text-primary">{quotaInfo.remaining} / {quotaInfo.limit}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (quotaInfo.used / quotaInfo.limit) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            *Limit soal di-reset secara berkala setiap 24 jam.
          </p>
        </div>
      ),
      icon: Zap,
      colorClass: 'border-gray-200',
      bgClass: 'bg-white',
      iconColorClass: 'text-yellow-500'
    });

    setActiveNotifs(newNotifs);
  }, [quotaInfo]);

  const visibleNotifs = activeNotifs.filter(n => !dismissedNotifs.includes(n.id));
  const hasUnread = visibleNotifs.some(n => !readNotifs.includes(n.id));

  const handleNotificationClick = () => {
    if (!notificationOpen) {
      // Mark as read when opening
      const newReads = [...readNotifs];
      let changed = false;
      visibleNotifs.forEach(n => {
        if (!newReads.includes(n.id)) {
          newReads.push(n.id);
          changed = true;
        }
      });
      if (changed) {
        setReadNotifs(newReads);
        localStorage.setItem('smartify_read_notifs', JSON.stringify(newReads));
      }
    }
    setNotificationOpen(!notificationOpen);
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDismissed = [...dismissedNotifs, id];
    setDismissedNotifs(newDismissed);
    localStorage.setItem('smartify_dismissed_notifs', JSON.stringify(newDismissed));
  };

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
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white font-sans">
        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Back Button & Logo/Title */}
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
                  src="/images/logo3.png"
                  alt="Smartify Logo"
                  width={120}
                  height={40}
                  priority
                  className="h-7 w-auto"
                />
              </Link>
            )}
          </div>

          {/* Center: Desktop Navigation */}
          {!backHref && !title && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
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

          {/* Right: Actions */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            <button 
              onClick={() => setPremiumModalOpen(true)}
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
                onClick={handleNotificationClick}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
                )}
              </button>

              {notificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="border-b border-border bg-gray-50 px-4 py-3 flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-bold text-foreground">Notifikasi</h3>
                      {user?.subscription_status === 'premium' && (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">PREMIUM</span>
                      )}
                    </div>
                    
                    <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                      {quotaLoading && activeNotifs.length === 0 ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                      ) : visibleNotifs.length > 0 ? (
                        visibleNotifs.map(notif => (
                          <div key={notif.id} className={`rounded-xl border ${notif.colorClass} ${notif.bgClass} p-3 relative group`}>
                            <button 
                              onClick={(e) => dismissNotification(notif.id, e)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Hapus notifikasi"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="flex items-center gap-2 mb-1.5 pr-6">
                              <notif.icon className={`h-4 w-4 ${notif.iconColorClass}`} />
                              <span className={`text-xs font-bold ${notif.iconColorClass.replace('text-', 'text-').replace('/20', '')}`}>{notif.title}</span>
                            </div>
                            {notif.content}
                            {notif.action && (
                              <button 
                                onClick={() => {
                                  setNotificationOpen(false);
                                  notif.action?.onClick();
                                }}
                                className={`text-[11px] font-bold underline underline-offset-2 mt-1 ${notif.iconColorClass}`}
                              >
                                {notif.action.label}
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                          <Bell className="h-8 w-8 text-gray-200" />
                          <p className="text-[11px] text-muted-foreground">Tidak ada notifikasi baru.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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

      {/* Mobile Navigation Drawer */}
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
                onClick={() => setPremiumModalOpen(true)}
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

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={premiumModalOpen} 
        onClose={() => setPremiumModalOpen(false)} 
        currentPlan={user?.subscription_status === 'premium' && user?.expired_at && new Date(user.expired_at) > new Date() ? "premium" : "free"}
        expiredAt={user?.expired_at}
      />
    </>
  );
}
