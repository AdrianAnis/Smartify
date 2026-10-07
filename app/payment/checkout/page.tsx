"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QrCode, CheckCircle2, Loader2, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/dashboard/Navbar";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success">("pending");
  const [mayarLink, setMayarLink] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function createInvoice() {
      try {
        const res = await fetch("/api/payment/create-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: 79000,
            description: "Smartify Premium 1 Bulan"
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Gagal membuat invoice");
        }

        if (data.data?.url) {
          setQrImageUrl(data.data.url);
        } else if (data.link) {
          setMayarLink(data.link);
        } else if (data.data?.link) {
          setMayarLink(data.data.link);
        }
      } catch (err) {
        console.error("Error API Mayar:", err);
        setErrorMsg(err instanceof Error ? err.message : "Gagal membuat invoice");
      } finally {
        setLoading(false);
      }
    }

    createInvoice();
  }, []);

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      if (qrImageUrl) {
        const res = await fetch("/api/payment/simulate", { method: "POST" });
        if (!res.ok) throw new Error("Gagal simulasi upgrade");
        
        setPaymentStatus("success");
        setTimeout(() => {
          router.push("/dashboard?upgrade=success");
          router.refresh();
        }, 2000);
      } else if (mayarLink) {
        window.open(mayarLink, "_blank");
        setLoading(false);
      } else {
        const res = await fetch("/api/payment/simulate", { method: "POST" });
        if (!res.ok) throw new Error("Gagal simulasi upgrade");

        setPaymentStatus("success");
        setTimeout(() => {
          router.push("/dashboard?upgrade=success");
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal memproses pembayaran");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar backHref="/dashboard" title="Detail Pembayaran" />

      <main className="flex-1 flex items-center justify-center p-4 pt-28 md:pt-32">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-start">
          
          <div className="bg-white rounded-xl p-6 md:p-8">

            <h1 className="text-2xl font-bold text-foreground mb-2">Rincian Pembayaran</h1>
            <p className="text-sm text-muted-foreground mb-8">Selesaikan pembayaran untuk mengaktifkan Smartify Premium.</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Smartify Premium
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Akses 30 Hari</p>
                </div>
                <span className="font-bold text-foreground">Rp 79.000</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 pt-4">
                <li>• 200 soal / hari</li>
                <li>• Semua Jenis Soal</li>
                <li>• Prioritas AI Processing</li>
              </ul>
            </div>

            <div className="flex justify-between items-center py-4">
              <span className="text-foreground">Subtotal</span>
              <span className="font-medium text-foreground">Rp 79.000</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-foreground">Biaya Layanan</span>
              <span className="font-medium text-foreground">Rp 0</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-bold text-foreground">Total Tagihan</span>
              <span className="text-xl font-bold text-primary">Rp 79.000</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 md:p-8 flex flex-col h-full">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-gray-400" />
              Pembayaran via QRIS
            </h2>

            {paymentStatus === "success" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Pembayaran Berhasil!</h3>
                <p className="text-sm text-muted-foreground">Akun Anda sekarang adalah Premium. Mengarahkan kembali...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-gray-50 rounded-xl p-8 mb-6 w-full flex flex-col items-center justify-center min-h-[250px] relative">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium">Menghubungkan ke Mayar...</span>
                    </div>
                  ) : errorMsg ? (
                    <div className="flex flex-col items-center text-center text-red-500 p-4">
                      <AlertCircle className="h-10 w-10 mb-2 text-red-500" />
                      <p className="text-sm font-bold">Gagal memuat QRIS</p>
                      <p className="text-xs mt-1 text-red-400 max-w-[200px] break-words">{errorMsg}</p>
                    </div>
                  ) : qrImageUrl ? (
                    <div className="flex flex-col items-center">
                      <div className="w-64 h-64 bg-white p-2 rounded-xl mb-4 flex items-center justify-center border border-border shadow-sm overflow-hidden">
                        <Image src={qrImageUrl} alt="QRIS Code" width={240} height={240} unoptimized className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Buka aplikasi pembayaran (OVO, GoPay, Dana, m-Banking) untuk scan QRIS ini.
                      </p>
                    </div>
                  ) : mayarLink ? (
                    <div className="flex flex-col items-center">
                      <div className="w-48 h-48 bg-white p-2 rounded-xl border border-border mb-4 flex flex-col items-center justify-center text-center">
                         <QrCode className="h-20 w-20 text-gray-300 mb-2" />
                         <span className="text-xs text-muted-foreground font-medium">Klik Lanjut Bayar untuk QRIS</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Sistem Mayar siap. Klik tombol di bawah untuk membayar.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-48 h-48 bg-white p-2 rounded-xl mb-4 flex items-center justify-center border border-border shadow-sm">
                        <QrCode className="h-32 w-32 text-gray-800" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Buka aplikasi pembayaran untuk scan QRIS ini.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-50 px-4 py-2 rounded-full mb-6">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Pembayaran aman diproses oleh Mayar</span>
                </div>

                <button 
                  onClick={handleSimulatePayment}
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading 
                    ? "Memproses..." 
                    : mayarLink 
                      ? "Lanjut ke Mayar" 
                      : (qrImageUrl ? "Simulasi Pembayaran (Sandbox)" : "Simulasi Bayar (Fallback)")}
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
