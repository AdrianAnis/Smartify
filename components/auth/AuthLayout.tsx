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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc || defaultImage}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay so the white form stands out */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      {/* Floating Form Card */}
      <div className="relative z-10 w-full max-w-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-8 sm:p-10 flex-1 overflow-y-auto custom-scrollbar">
          {/* Logo on top of form */}
          <div className="flex justify-center mb-8">
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
          
          {/* Centered Heading */}
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          
          {/* The Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
