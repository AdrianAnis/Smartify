import Image from "next/image";

interface GoogleLoginButtonProps {
  href: string;
  text?: string;
}

export function GoogleLoginButton({ href, text = "Lanjutkan dengan Google" }: GoogleLoginButtonProps) {
  return (
    <a
      href={href}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-border text-card-foreground font-medium rounded-xl hover:bg-gray-50 transition-colors"
    >
      <Image
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google logo"
        width={20}
        height={20}
      />
      {text}
    </a>
  );
}
