import Image from "next/image";
import { ReactNode } from "react";
import Link from "next/link";

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  imageSrc?: string;
}

export function AuthLayout({ children, title, description, imageSrc }: AuthLayoutProps) {
  const defaultImage = "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden">
      {/* Left Column (Image and Text) - Fixed 60% */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-gray-100 overflow-hidden">
        {/* Background Image (No color overlay as requested) */}
        <div className="absolute inset-0 z-0">
          <Image
            src={imageSrc || defaultImage}
            alt="Ilustrasi"
            fill
            className="object-cover"
            priority
          />
          {/* Subtle gradient at the bottom so text is readable if image is bright */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end px-10 xl:px-16 pb-16 xl:pb-24 text-white w-full h-full">
          <div className="mb-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              {title || "Transformasi Pendidikan dengan AI"}
            </h1>
            <p className="text-lg xl:text-xl text-white/90 max-w-xl leading-relaxed font-light">
              {description || "Otomatisasi pembuatan kuis, analisis nilai, dan hasil belajar siswa secara instan dan cerdas dengan Smartify."}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column (Auth Form) - Scrollable 40% */}
      <div className="w-full lg:w-[40%] flex flex-col bg-white overflow-y-auto">
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12 min-h-full">
          <div className="w-full max-w-[400px] mx-auto space-y-8 py-8">
            {/* Logo on top of form */}
            <div className="flex justify-start mb-8">
              <Link href="/">
                <Image
                  src="/images/logo3.png"
                  alt="Logo Smartify"
                  width={160}
                  height={52}
                  priority
                />
              </Link>
            </div>
            
            {/* The Form Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
