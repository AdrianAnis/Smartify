import Link from "next/link";
import { QuizDemo } from "./QuizDemo";

function PaperArtwork({ side }: { side: "left" | "right" }) {
  return (
    <div className={`landing-paper landing-paper-${side}`} aria-hidden="true">
      <svg viewBox="0 0 180 220" fill="none">
        <path d="M29 24 127 11 158 49 151 193 34 211Z" fill="var(--primary)" stroke="var(--primary)" />
        <path d="m29 24 98-13-1 45 32-7-7 144-117 18Z" fill="var(--primary)" />
        <path d="m127 11-1 45 32-7" stroke="#ffffff" strokeOpacity=".65" />
        <path d="m50 78 69-9M49 94l80-10M47 110l62-8M46 148l74-9M45 164l53-7" stroke="#ffffff" strokeOpacity=".55" strokeWidth="2" />
        <path d="m41 44 37-5" stroke="#ffffff" strokeWidth="4" />
        <path d="m57 184 7 6 13-16" stroke="#ffffff" strokeWidth="2.5" />
        <path d="m29 24 5 187-8-7-6-172Z" fill="var(--primary)" stroke="#ffffff" strokeOpacity=".45" />
      </svg>
    </div>
  );
}

export function Hero() {
  return (
    <>
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-orbits" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <PaperArtwork side="left" />
        <PaperArtwork side="right" />
        <div className="landing-hero-copy">
          <h1 id="hero-title">
            Soal tersusun otomatis.
            <br />
            <span>Kelas berjalan lebih cerdas.</span>
          </h1>
          <p className="landing-hero-description">
            Smartify membantu guru membuat kuis dari topik atau materi dalam
            hitungan detik, menjalankannya langsung di kelas, lalu membaca hasil
            belajar siswa tanpa repot menghitung manual.
          </p>
          <div className="landing-hero-actions">
            <Link href="/auth/register" className="landing-button">
              Buat kuis pertamamu
            </Link>
            <a href="#demo" className="landing-button landing-button-outline">
              Coba contohnya
            </a>
          </div>
          <p className="landing-hero-note">
            Mulai dengan akun gratis. Siswa bergabung tanpa daftar.
          </p>
        </div>
      </section>
      <QuizDemo />
    </>
  );
}
