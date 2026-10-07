import Image from "next/image";
import { ReactNode } from "react";
import Link from "next/link";

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  formTitle?: string;
  formDescription?: ReactNode;
  imageSrc?: string;
}

export function AuthLayout({ children, title, description, formTitle, formDescription, imageSrc }: AuthLayoutProps) {
  const defaultImage = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden">
      <div className="hidden lg:flex lg:w-[60%] relative bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={imageSrc || defaultImage}
            alt="Ilustrasi"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        </div>
        
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

      <div className="w-full lg:w-[40%] flex flex-col bg-white overflow-y-auto">
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12 min-h-full">
          <div className="w-full max-w-[400px] mx-auto space-y-8 py-8">
            <div className="flex flex-col items-center text-center mb-8">
              <Link href="/" className="mt-6 mb-6">
                <Image
                  src="/images/logo3.png"
                  alt="Logo Smartify"
                  width={160}
                  height={52}
                  priority
                />
              </Link>
              {formTitle && (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {formTitle}
                </h1>
              )}
              {formDescription && (
                <p className="text-gray-500 text-sm">
                  {formDescription}
                </p>
              )}
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
