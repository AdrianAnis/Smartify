"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, Zap, CalendarClock, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumModal } from "@/components/premium/PremiumModal";

interface Transaction {
  transaction_id: number;
  amount: number;
  description: string;
  method: string;
  status: string;
  created_at: string;
}

interface BillingData {
  isPremium: boolean;
  expiredAt: string | null;
  used: number;
  limit: number;
  remaining: number;
  transactions: Transaction[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function BillingSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-8 h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="mt-8 h-64" />
    </div>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/user/billing");
        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data billing");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  if (loading) return <BillingSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-xl bg-danger-subtle p-4 text-sm font-medium text-danger-text">
        {error || "Gagal memuat data billing"}
      </div>
    );
  }

  const expiry = data.expiredAt ? new Date(data.expiredAt) : null;
  const daysRemaining = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const usedPercent = Math.min(100, (data.used / data.limit) * 100);

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Billing</p>
        <h1 className="text-2xl font-bold text-card-foreground">Langganan & Transaksi</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
            {data.isPremium ? <Crown className="h-4 w-4 text-primary" /> : <Sparkles className="h-4 w-4 text-gray-400" />}
            Paket
          </div>
          <p className="text-2xl font-bold text-card-foreground">{data.isPremium ? "Premium" : "Gratis"}</p>
          <button
            type="button"
            onClick={() => setPremiumModalOpen(true)}
            className="mt-4 text-sm font-bold text-primary underline underline-offset-2"
          >
            {data.isPremium ? "Perpanjang" : "Upgrade ke Premium"}
          </button>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
            <Zap className="h-4 w-4 text-yellow-500" />
            Limit soal harian
          </div>
          <p className="text-2xl font-bold text-card-foreground">
            {data.remaining} <span className="text-base font-medium text-gray-400">/ {data.limit}</span>
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-400">Dihitung bergulir setiap 24 jam.</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            Masa langganan
          </div>
          {data.isPremium && expiry ? (
            <>
              <p className="text-2xl font-bold text-card-foreground">{daysRemaining} hari lagi</p>
              <p className="mt-4 text-sm text-gray-500">Aktif sampai {formatDate(expiry.toISOString())}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-card-foreground">Tidak aktif</p>
              <p className="mt-4 text-sm text-gray-500">Anda menggunakan paket gratis.</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-base font-bold text-card-foreground">
          <Receipt className="h-5 w-5 text-gray-400" />
          Riwayat transaksi
        </div>

        {data.transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4">Tanggal</th>
                  <th className="pb-3 pr-4">Deskripsi</th>
                  <th className="pb-3 pr-4">Metode</th>
                  <th className="pb-3 pr-4 text-right">Jumlah</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="border-t border-border">
                    <td className="py-3 pr-4 text-gray-600">{formatDateTime(tx.created_at)}</td>
                    <td className="py-3 pr-4 font-medium text-card-foreground">{tx.description}</td>
                    <td className="py-3 pr-4 text-gray-600">{tx.method}</td>
                    <td className="py-3 pr-4 text-right font-medium text-card-foreground">{formatRupiah(tx.amount)}</td>
                    <td className="py-3 text-right">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {tx.status === "paid" ? "Berhasil" : tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        currentPlan={data.isPremium ? "premium" : "free"}
        expiredAt={data.expiredAt ?? undefined}
      />
    </div>
  );
}
