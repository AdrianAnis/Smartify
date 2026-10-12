"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { BookOpen, Clock, Users } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Skeleton } from "@/components/ui/Skeleton";

interface WaitingQuizInfo {
  judul: string;
  totalSoal: number;
  durasiMenit: number;
}

const HERO_IMAGE = "/images/join-class.jpg";
const HERO_TITLE = "Sebentar lagi kuis dimulai";
const HERO_DESCRIPTION = "Tetap di halaman ini. Soal akan terbuka otomatis begitu guru memulai kuis.";

export default function StudentWaitingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);
  const [kuisId, setKuisId] = useState<number | null>(null);
  const [sesiId, setSesiId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [jumlahPeserta, setJumlahPeserta] = useState(0);
  const [quizInfo, setQuizInfo] = useState<WaitingQuizInfo | null>(null);
  const [isReady, setIsReady] = useState(false);

  const redirectToResultWhenReady = useCallback(
    async (t: string) => {
      try {
        const res = await fetch(`/api/join/${t}/result?ready=1`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.ready) {
          router.replace(`/join/${t}/result`);
        } else if (!res.ok) {
          console.error(`Failed to verify quiz result before navigation: HTTP ${res.status}`);
        }
      } catch (error) {
        console.error("Failed to verify quiz result before navigation:", error);
      }
    },
    [router],
  );

  useEffect(() => {
    async function initWaiting(t: string) {
      try {
        const res = await fetch(`/api/join/${t}`);
        const data = await res.json();
        if (data.status === "ongoing") {
          router.replace(`/join/${t}/play`);
          return;
        }

        if (data.status === "selesai" || data.status === "finished") {
          await redirectToResultWhenReady(t);
          return;
        }

        if (!res.ok) {
          router.replace(`/join/${t}`);
          return;
        }

        setKuisId(data.kuisId);
        setSesiId(data.sesiId);
        setJumlahPeserta(data.jumlahPeserta ?? 0);
        setQuizInfo({ judul: data.judul, totalSoal: data.totalSoal, durasiMenit: data.durasiMenit });

        const meRes = await fetch(`/api/join/${t}/me`);
        const meData = await meRes.json();
        if (meData.nama) setNama(meData.nama);

        setIsReady(true);
      } catch {
        router.replace(`/join/${t}`);
      }
    }

    void initWaiting(token);
  }, [token, router, redirectToResultWhenReady]);

  const syncQuizStatus = useCallback(
    async (t: string) => {
      try {
        const res = await fetch(`/api/join/${t}`, { cache: "no-store" });
        const data = await res.json();

        if (data.isRegistered === false) {
          router.replace(`/join/${t}?kicked=1`);
        } else if (data.status === "ongoing") {
          router.replace(`/join/${t}/play`);
        } else if (data.status === "selesai" || data.status === "finished") {
          await redirectToResultWhenReady(t);
        } else if (res.status === 404) {
          router.replace(`/join/${t}`);
        } else if (typeof data.jumlahPeserta === "number") {
          setJumlahPeserta(data.jumlahPeserta);
        }
      } catch (error) {
        console.error("Failed to sync waiting-room quiz status:", error);
      }
    },
    [router, redirectToResultWhenReady],
  );

  useEffect(() => {
    if (!kuisId || !sesiId || !token) return;

    const channel = supabase
      .channel(`quiz-${token}`, { config: { private: false } })
      .on(
        "broadcast",
        { event: "quiz-updated" },
        () => {
          void syncQuizStatus(token);
        },
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          void syncQuizStatus(token);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Waiting-room realtime subscription failed:", error ?? status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [kuisId, sesiId, token, syncQuizStatus]);

  if (!isReady || !quizInfo) {
    return (
      <AuthLayout imageSrc={HERO_IMAGE} title={HERO_TITLE} description={HERO_DESCRIPTION}>
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="mx-auto h-8 w-44" />
          <Skeleton className="mx-auto h-4 w-56" />
          <Skeleton className="mt-6 h-36 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </AuthLayout>
    );
  }

  const details = [
    { icon: BookOpen, label: "Soal", value: String(quizInfo.totalSoal) },
    { icon: Clock, label: "Menit", value: String(quizInfo.durasiMenit) },
    { icon: Users, label: "Peserta", value: String(jumlahPeserta) },
  ];

  return (
    <AuthLayout
      imageSrc={HERO_IMAGE}
      title={HERO_TITLE}
      description={HERO_DESCRIPTION}
      formTitle={nama ? `Halo, ${nama}!` : "Halo!"}
      formDescription="Kamu sudah berada di ruang tunggu"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kuis</p>
          <p className="mt-1 line-clamp-2 text-lg font-bold text-gray-900">{quizInfo.judul}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {details.map((item) => (
              <div key={item.label} className="rounded-xl bg-white p-3 text-center shadow-sm">
                <item.icon className="mx-auto h-4 w-4 text-primary" />
                <dd className="mt-1.5 text-lg font-bold tabular-nums text-gray-900">{item.value}</dd>
                <dt className="text-xs text-gray-500">{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div role="status" className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Menunggu guru memulai kuis</p>
            <p className="mt-0.5 text-xs text-gray-500">Halaman akan berpindah sendiri, tidak perlu dimuat ulang.</p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
