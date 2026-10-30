import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-top">
          <div>
            <Link href="/" aria-label="Beranda Smartify">
              <Image
                src="/logo_smartify.svg"
                alt="Smartify"
                width={130}
                height={32}
              />
            </Link>
            <p>
              Lebih dekat dengan cara
              <br />
              kelasmu belajar.
            </p>
          </div>
          <nav aria-label="Jelajahi Smartify">
            <span>Jelajahi</span>
            <a href="#fitur">Kenapa Smartify</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#paket">Paket</a>
          </nav>
          <nav aria-label="Akun Smartify">
            <span>Mulai di sini</span>
            <Link href="/auth/register">Buat akun</Link>
            <Link href="/auth/login">Masuk</Link>
            <a href="#demo">Coba contoh kuis</a>
          </nav>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Smartify. Seluruh hak cipta dilindungi.</p>
          <span>Precision in Learning.</span>
          <a href="#top">Kembali ke atas</a>
        </div>
      </div>
    </footer>
  );
}
