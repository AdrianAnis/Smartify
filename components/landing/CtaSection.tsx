import Link from "next/link";

export function CtaSection() {
  return (
    <section
      className="landing-cta landing-container"
      aria-labelledby="cta-title"
    >
      <div>
        <span className="landing-overline">UNTUK PERTEMUAN BERIKUTNYA</span>
        <h2 id="cta-title">
          Bawa rasa ingin tahu.
          <br />
          <span>Kuisnya, kita siapkan.</span>
        </h2>
        <p>Satu topik hari ini bisa jadi awal pemahaman baru di kelasmu.</p>
        <Link href="/auth/register" className="landing-button">
          Buat kuis pertamamu
        </Link>
      </div>
      <div className="landing-cta-art" aria-hidden="true">
        <div className="landing-cta-sheet">
          <span>CATATAN KELAS</span>
          <strong>
            Ide besar.
            <br />
            Mulai dari
            <br />
            satu soal.
          </strong>
          <i />
          <i />
          <i />
          <span>Smartify</span>
        </div>
        <div className="landing-cta-sheet-back" />
      </div>
    </section>
  );
}
