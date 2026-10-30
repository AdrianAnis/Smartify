"use client";

import { useState, type CSSProperties } from "react";
import { BookOpen, Check } from "lucide-react";

const questions = [
  {
    title: "Manakah yang termasuk komponen biotik dalam ekosistem?",
    options: ["Cahaya matahari", "Air dan mineral", "Rumput dan belalang", "Suhu udara"],
    correct: 2,
    explanation: "Komponen biotik adalah makhluk hidup, termasuk tumbuhan dan hewan.",
  },
  {
    title: "Apa peran tumbuhan dalam rantai makanan?",
    options: ["Produsen", "Konsumen primer", "Konsumen sekunder", "Pengurai"],
    correct: 0,
    explanation:
      "Tumbuhan menjadi produsen karena membuat makanannya sendiri melalui fotosintesis.",
  },
  {
    title: "Hubungan lebah dan bunga merupakan contoh simbiosis apa?",
    options: ["Parasitisme", "Komensalisme", "Kompetisi", "Mutualisme"],
    correct: 3,
    explanation:
      "Lebah mendapat nektar dan bunga terbantu penyerbukannya. Keduanya diuntungkan.",
  },
];

export function QuizDemo() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = questions[questionIndex];
  const answer = answers[questionIndex];
  const answered = answers.filter((value) => value !== null).length;
  const correct = answers.filter(
    (value, index) => value === questions[index].correct,
  ).length;
  const isLastQuestion = questionIndex === questions.length - 1;

  function choose(index: number) {
    if (answer !== null) return;
    setAnswers((previous) =>
      previous.map((value, i) => (i === questionIndex ? index : value)),
    );
  }

  function reset() {
    setAnswers([null, null, null]);
    setQuestionIndex(0);
    setStep(1);
  }

  function next() {
    if (isLastQuestion) setStep(2);
    else setQuestionIndex(questionIndex + 1);
  }

  function resume() {
    setQuestionIndex(answers.findIndex((value) => value === null));
    setStep(1);
  }

  function optionClass(index: number) {
    const classes = ["landing-answer"];
    if (answer !== null && index === question.correct) classes.push("is-correct");
    if (answer === index && index !== question.correct) classes.push("is-incorrect");
    return classes.join(" ");
  }

  return (
    <section
      id="demo"
      className="landing-demo landing-container"
      aria-label="Contoh kuis Smartify"
    >
      <div className="landing-demo-scene">
        <aside className="landing-material">
          <span className="landing-overline">01 / MATERI</span>
          <div className="landing-book-art" aria-hidden="true">
            <BookOpen size={57} strokeWidth={1} />
            <span>
              IPA
              <br />
              <strong>VII</strong>
            </span>
          </div>
          <h3>
            Ekosistem &amp;
            <br />
            interaksinya.
          </h3>
          <p>Satu topik untuk memulai percakapan di kelas.</p>
          <dl>
            <div>
              <dt>Mata pelajaran</dt>
              <dd>Ilmu Pengetahuan Alam</dd>
            </div>
            <div>
              <dt>Bentuk soal</dt>
              <dd>Pilihan ganda</dd>
            </div>
            <div>
              <dt>Contoh kuis</dt>
              <dd>3 pertanyaan</dd>
            </div>
          </dl>
        </aside>

        <div className="landing-quiz-panel">
          <div className="landing-quiz-top">
            <span>SMARTIFY / COBA KUIS</span>
            <span>
              {step === 2
                ? "Selesai"
                : `${String(questionIndex + 1).padStart(2, "0")} / 03`}
            </span>
          </div>

          {step === 0 && (
            <div className="landing-demo-intro">
              <BookOpen size={34} strokeWidth={1.2} aria-hidden="true" />
              <h3>
                Mulai dari yang
                <br />
                sedang dipelajari.
              </h3>
              <p>
                Di Smartify, kamu bisa menulis topik atau mengunggah materi,
                lalu mengatur soal sesuai kebutuhan kelas.
              </p>
              <div className="landing-demo-topic">
                <span>Contoh topik</span>
                <strong>Ekosistem &amp; interaksinya</strong>
              </div>
              <button
                type="button"
                className="landing-button"
                onClick={() => setStep(1)}
              >
                Lihat contoh soal
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="landing-question" key={questionIndex}>
              <span className="landing-question-label">
                Pertanyaan {questionIndex + 1}
              </span>
              <h3>{question.title}</h3>
              <div
                className="landing-answer-options"
                role="group"
                aria-label="Pilih jawaban"
              >
                {question.options.map((option, index) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => choose(index)}
                    disabled={answer !== null}
                    aria-pressed={answer === index}
                    className={optionClass(index)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                    {answer !== null && index === question.correct && (
                      <Check size={16} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
              <div className="landing-answer-feedback" aria-live="polite">
                {answer === null ? (
                  "Pilih jawabanmu. Coba rasakan alurnya."
                ) : (
                  <>
                    <strong>
                      {answer === question.correct ? "Betul! " : "Belum tepat. "}
                    </strong>
                    {question.explanation}
                  </>
                )}
              </div>
              <button
                type="button"
                className="landing-button landing-demo-next"
                disabled={answer === null}
                onClick={next}
              >
                {isLastQuestion ? "Lihat hasilku" : "Soal berikutnya"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="landing-demo-result" aria-live="polite">
              <span className="landing-question-label">Hasil percobaanmu</span>
              <p className="landing-result-score">
                {correct}
                <span> / 3</span>
              </p>
              <h3>
                {answered < 3
                  ? "Masih ada yang bisa dicoba."
                  : correct === 3
                    ? "Konsepnya sudah kamu kuasai."
                    : "Selalu ada ruang untuk belajar."}
              </h3>
              <p>
                {answered < 3
                  ? `Kamu sudah menjawab ${answered} dari 3 pertanyaan. Lanjutkan kuis untuk melihat hasil lengkap.`
                  : "Di kelasmu nanti, nilai setiap siswa dan ringkasan jawaban bisa dilihat setelah kuis selesai."}
              </p>
              <button
                type="button"
                className="landing-button"
                onClick={answered < 3 ? resume : reset}
              >
                {answered < 3 ? "Lanjutkan kuis" : "Coba sekali lagi"}
              </button>
            </div>
          )}
        </div>

        <aside className="landing-demo-insight">
          <span className="landing-overline">03 / HASIL BELAJAR</span>
          <div className="landing-progress-art" aria-hidden="true">
            <div
              style={
                { "--demo-progress": `${(answered / 3) * 100}%` } as CSSProperties
              }
            >
              <span>
                {answered}
                <small>/ 3</small>
              </span>
            </div>
          </div>
          <h3>
            Jawaban terkumpul.
            <br />
            Hasil terbaca.
          </h3>
          <p>Setiap jawaban membantu melihat apa yang sudah dipahami.</p>
          <dl>
            <div>
              <dt>Sudah dijawab</dt>
              <dd>{answered} soal</dd>
            </div>
            <div>
              <dt>Jawaban benar</dt>
              <dd>{correct} soal</dd>
            </div>
          </dl>
          <p className="landing-demo-disclaimer">
            Data di sini berasal dari percobaanmu, bukan hasil kelas sungguhan.
          </p>
        </aside>
      </div>
    </section>
  );
}
