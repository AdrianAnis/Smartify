"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#fitur", label: "Kenapa Smartify" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#paket", label: "Paket" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" aria-label="Beranda Smartify" className="landing-logo">
          <Image
            src="/logo_smartify.svg"
            alt="Smartify"
            width={130}
            height={32}
            priority
          />
        </Link>
        <nav
          id="landing-navigation"
          aria-label="Navigasi utama"
          className="landing-nav-links"
          data-open={open}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/auth/login" className="landing-mobile-login">
            Masuk ke akun
          </Link>
        </nav>
        <div className="landing-nav-actions">
          <Link href="/auth/login" className="landing-login">
            Masuk
          </Link>
          <Link
            href="/auth/register"
            className="landing-button landing-button-small"
          >
            Mulai gratis
          </Link>
          <button
            type="button"
            className="landing-menu"
            aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={open}
            aria-controls="landing-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
