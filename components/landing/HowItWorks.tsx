const steps = [
  {
    title: "Bawa materinya.",
    text: "Masukkan topik atau unggah bahan ajar. Pilih bentuk soal dan sesuaikan dengan kebutuhan siswa.",
  },
  {
    title: "Ajak kelasmu.",
    text: "Periksa soal, bagikan tautan, lalu mulai bersama. Siswa masuk tanpa membuat akun.",
  },
  {
    title: "Temukan polanya.",
    text: "Baca rekap nilai dan jawaban. Tentukan konsep mana yang perlu dibahas lagi di pertemuan berikutnya.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="landing-section landing-container"
      aria-labelledby="how-title"
    >
      <div className="landing-section-heading">
        <div>
          <h2 id="how-title">
            Dari bahan ajar
            <br />
            <span>ke pemahaman baru.</span>
          </h2>
        </div>
        <p>
          Alur yang sederhana, dari sebelum kelas dimulai sampai jawaban
          terakhir terkumpul.
        </p>
      </div>
      <ol className="landing-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="landing-step-number">0{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
