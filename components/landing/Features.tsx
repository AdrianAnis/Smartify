import { Check } from "lucide-react";
import Link from "next/link";

const students = [
  { name: "Aisyah", value: 90 },
  { name: "Bima", value: 70 },
  { name: "Citra", value: 45 },
];

export function Features() {
  return (
    <section
      id="fitur"
      className="landing-section landing-container"
      aria-labelledby="features-title"
    >
      <div className="landing-section-heading">
        <div>
          <h2 id="features-title">
            Persiapannya ringkas.
            <br />
            <span>Mengajarnya tetap milikmu.</span>
          </h2>
        </div>
        <p>
          Teknologi membantu menyusun dan merangkum. Kamu tetap menentukan apa
          yang terbaik untuk kelasmu.
        </p>
      </div>

      <div className="landing-feature-grid">
        <article className="landing-feature landing-feature-create">
          <div className="landing-feature-copy">
            <span className="landing-feature-number">01</span>
            <h3>
              Materimu jadi soal.
              <br />
              Tetap bisa kamu olah.
            </h3>
            <p>
              Tulis topik atau unggah materi. Atur jumlah dan tingkat
              kesulitan, lalu periksa dan edit sebelum dibagikan.
            </p>
          </div>
          <div className="landing-editor" aria-label="Contoh pengaturan kuis">
            <div>
              <span>Topik pembelajaran</span>
              <strong>Sistem peredaran darah</strong>
            </div>
            <div className="landing-editor-fields">
              <div>
                <span>Jumlah soal</span>
                <strong>20 soal</strong>
              </div>
              <div>
                <span>Kesulitan</span>
                <strong>Sedang</strong>
              </div>
            </div>
            <div className="landing-editor-line">
              <Check size={15} aria-hidden="true" />
              <span>Soal bisa diedit sebelum dibagikan</span>
            </div>
          </div>
        </article>

        <article className="landing-feature landing-feature-class">
          <div className="landing-feature-copy">
            <span className="landing-feature-number">02</span>
            <h3>
              Satu tautan.
              <br />
              Seluruh kelas ikut.
            </h3>
            <p>
              Siswa cukup membuka tautan, mengisi nama, dan bergabung. Pantau
              progres mereka saat kuis berlangsung.
            </p>
          </div>
          <div className="landing-classroom" aria-label="Ilustrasi progres siswa">
            <div className="landing-classroom-head">
              <span>Progres pengerjaan</span>
              <span>Contoh tampilan</span>
            </div>
            {students.map((student) => (
              <div className="landing-student" key={student.name}>
                <span>{student.name}</span>
                <div>
                  <i style={{ width: `${student.value}%` }} />
                </div>
                <span>{student.value}%</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="landing-feature-summary">
        <div>
          <span className="landing-feature-number">03</span>
          <h3>Selesai kuis, tahu langkah berikutnya.</h3>
          <p>
            Nilai terkumpul otomatis. Lihat soal yang sering keliru dan gunakan
            AI Insight di paket Premium untuk membantu merencanakan pengulangan
            materi.
          </p>
        </div>
        <Link href="/auth/register" className="landing-text-link">
          Kenali kelasmu lebih dekat
        </Link>
      </div>
    </section>
  );
}
