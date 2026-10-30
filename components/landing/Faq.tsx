import { ChevronDown } from "lucide-react";

const questions = [
  {
    question: "Apakah siswa perlu membuat akun?",
    answer:
      "Tidak. Siswa cukup memindai QR code atau membuka tautan kuis, mengisi nama, lalu bergabung. Akun hanya dibutuhkan oleh guru.",
  },
  {
    question: "Materi seperti apa yang bisa dipakai untuk membuat soal?",
    answer:
      "Unggah file PDF berukuran maksimal 10 MB. Hasil terbaik didapat dari materi berbasis teks yang jelas, karena AI menyusun soal dari isi dokumen tersebut.",
  },
  {
    question: "Apakah soal dari AI bisa diedit?",
    answer:
      "Bisa. Setelah soal dibuat, kamu dapat memeriksa dan mengubah teks soal, pilihan jawaban, kunci jawaban, topik, dan penjelasan sebelum kuis dibagikan ke siswa.",
  },
  {
    question: "Apa perbedaan paket Free dan Premium?",
    answer:
      "Paket Free dibatasi 20 nomor soal per hari dan hanya untuk soal Pilihan Ganda. Premium membuka 50 nomor soal per hari, soal Isian Singkat dan Campuran, soal tingkat sulit, serta AI Insight untuk analisis kelas.",
  },
  {
    question: "Bagaimana Smartify mencegah kecurangan saat kuis?",
    answer:
      "Setiap kali siswa berpindah tab atau jendela, pelanggarannya dicatat dan terlihat oleh guru. Pada pelanggaran ketiga, kuis siswa tersebut otomatis dikumpulkan. Kunci jawaban dan pembahasan baru dikirim setelah guru mengakhiri kuis.",
  },
  {
    question: "Apa yang bisa saya lihat setelah kuis selesai?",
    answer:
      "Kamu mendapat rekap nilai tiap siswa, tingkat kelulusan terhadap KKM, analisis penguasaan per topik, dan akurasi kelas untuk setiap soal. Rekap nilai juga bisa diunduh.",
  },
  {
    question: "Bagaimana cara membayar Premium?",
    answer:
      "Premium berharga Rp 79.000 untuk 30 hari. Pembayaran dilakukan lewat QRIS dan riwayat transaksinya tersimpan di halaman Billing.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="landing-section landing-container"
      aria-labelledby="faq-title"
    >
      <div className="landing-pricing-heading">
        <h2 id="faq-title">
          Pertanyaan yang <span>sering ditanyakan</span>
        </h2>
        <p>Belum menemukan jawabannya? Coba saja gratis dan lihat langsung alurnya.</p>
      </div>
      <div className="landing-faq-list">
        {questions.map((item) => (
          <details key={item.question}>
            <summary>
              <span>{item.question}</span>
              <ChevronDown size={22} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
