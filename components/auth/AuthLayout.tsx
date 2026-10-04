import Image from "next/image";
import { ReactNode } from "react";

export function AuthLayout({ children, title, description }: { children: ReactNode, title?: string, description?: string }) {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Column (Image and Text) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
            alt="Teacher teaching"
            fill
            className="object-cover opacity-30 mix-blend-overlay"
            priority
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white w-full h-full bg-gradient-to-t from-primary/90 via-primary/50 to-transparent">
          <div className="mb-10">
            <Image
              src="/images/logo_smartify.png"
              alt="Smartify Logo"
              width={160}
              height={50}
              className="brightness-0 invert mb-8"
            />
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              {title || "Transformasi Pendidikan dengan AI"}
            </h1>
            <p className="text-lg xl:text-xl text-white/90 max-w-lg leading-relaxed">
              {description || "Otomatisasi pembuatan kuis, analisis nilai, dan hasil belajar siswa secara instan dan cerdas dengan Smartify."}
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-white/20 backdrop-blur-sm">
                  <Image 
                    src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                    alt="User avatar" 
                    width={40} 
                    height={40}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-white/90">
              Bergabung dengan <span className="font-bold text-white">10.000+</span> guru lainnya.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column (Auth Form) */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-[440px] mx-auto space-y-8">
            <div className="lg:hidden flex justify-center mb-8">
              <Image
                src="/images/logo_smartify.png"
                alt="Logo"
                width={140}
                height={46}
                priority
              />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
