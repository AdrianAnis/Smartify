import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  FREE_DAILY_MAX_QUESTIONS,
  PREMIUM_DAILY_MAX_QUESTIONS,
} from "@/lib/subscription/plan";

const features = [
  { text: "Soal Pilihan Ganda", free: true },
  { text: "Soal Isian Singkat", free: false },
  { text: "Soal Campuran", free: false },
  { text: "Soal tingkat sulit", free: false },
  { text: "AI Insight analisis kelas", free: false },
];

function PlanCard({ premium = false }: { premium?: boolean }) {
  const maxQuestions = premium
    ? PREMIUM_DAILY_MAX_QUESTIONS
    : FREE_DAILY_MAX_QUESTIONS;

  const planFeatures = [
    { text: `Maksimal ${maxQuestions} nomor soal per hari`, included: true },
    ...features.map((feature) => ({
      text: feature.text,
      included: premium || feature.free,
    })),
  ];

  return (
    <article
      className={`landing-plan-card${premium ? " landing-plan-card-premium" : ""}`}
    >
      <h3>{premium ? "Premium" : "Free"}</h3>
      <p className="landing-plan-price">
        <span>{premium ? "Rp 79.000" : "Rp 0"}</span>
        {premium && <span className="landing-plan-period">/ 30 hari</span>}
      </p>
      <ul>
        {planFeatures.map((feature) => (
          <li
            key={feature.text}
            className={feature.included ? "" : "is-unavailable"}
          >
            {feature.included ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <X size={17} aria-hidden="true" />
            )}
            <span>
              {!feature.included && <span className="sr-only">Tidak termasuk:</span>}
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/auth/register"
        className={`landing-button${premium ? "" : " landing-button-outline"}`}
      >
        {premium ? "Daftar dan Upgrade" : "Mulai Gratis"}
      </Link>
    </article>
  );
}

export function Pricing() {
  return (
    <section
      id="paket"
      className="landing-section landing-container"
      aria-labelledby="pricing-title"
    >
      <div className="landing-pricing-heading">
        <h2 id="pricing-title">
          Pilih paket yang <span>sesuai kebutuhanmu</span>
        </h2>
        <p>
          Mulai gratis kapan saja, dan tingkatkan ke Premium saat kelasmu butuh
          lebih banyak.
        </p>
      </div>
      <div className="landing-pricing-cards">
        <PlanCard />
        <PlanCard premium />
      </div>
    </section>
  );
}
