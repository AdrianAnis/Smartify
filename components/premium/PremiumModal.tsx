"use client";

import { Check, X, Zap, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: "free" | "premium";
  expiredAt?: string | null;
}

export function PremiumModal({ isOpen, onClose, currentPlan, expiredAt }: PremiumModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  let canRenew = true;
  let daysRemaining = 0;
  if (currentPlan === "premium" && expiredAt) {
    const expiryDate = new Date(expiredAt);
    daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    canRenew = daysRemaining <= 3;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl bg-white shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground hover:bg-gray-100 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 text-center bg-gray-50/50">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Upgrade ke Premium</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Tingkatkan batas pembuatan soal Anda dan buka akses ke semua fitur canggih Smartify tanpa batasan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-8">
          <div className="relative rounded-xl p-6 bg-gray-50">
            {currentPlan === "free" && (
              <div className="absolute top-0 right-6 -translate-y-1/2">
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Paket Saat Ini</span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                Paket Free
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">Rp 0</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Maksimal <strong>20 nomor soal</strong> per hari</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Hanya bisa membuat soal <strong>Pilihan Ganda</strong></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="bg-gray-200 rounded-full p-1 mt-0.5">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <span>Tidak bisa akses soal Isian Singkat</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="bg-gray-200 rounded-full p-1 mt-0.5">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <span>Tidak bisa akses soal Campuran</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="bg-gray-200 rounded-full p-1 mt-0.5">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <span>Tidak bisa mengakses soal sulit</span>
              </li>
            </ul>

            <button 
              disabled
              className="w-full py-3 rounded-xl font-bold text-sm bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              {currentPlan === "free" ? "Paket Anda Saat Ini" : "Paket Free"}
            </button>
          </div>

          <div className="relative rounded-xl p-6 bg-primary/5">
            {currentPlan === "premium" && (
              <div className="absolute top-0 right-6 -translate-y-1/2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Paket Saat Ini</span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5" />
                Premium
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">Rp 79.000</span>
                <span className="text-muted-foreground font-medium">/ 30 hari</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Maksimal <strong>200 nomor soal</strong> per hari</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Bebas buat <strong>Semua Jenis Soal</strong></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Termasuk Soal Pilihan Ganda</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Termasuk Soal Isian Singkat & Campuran</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Mendapat Insight AI lebih detail dan jelas</span>
              </li>
            </ul>

            <button 
              onClick={() => {
                if (currentPlan === "premium" && !canRenew) return;
                onClose();
                router.push("/payment/checkout");
              }}
              disabled={currentPlan === "premium" && !canRenew}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                currentPlan === "premium" && !canRenew
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              <Zap className="h-4 w-4" />
              {currentPlan === "premium" 
                ? (canRenew ? "Perpanjang Premium" : `Perpanjang (H-3)`) 
                : "Upgrade Sekarang"}
            </button>
            {currentPlan === "premium" && !canRenew && (
              <p className="text-xs text-center mt-3 text-muted-foreground">
                Sisa waktu Anda <strong>{daysRemaining} hari</strong>. Tombol perpanjang aktif saat batas waktu tersisa 3 hari.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
