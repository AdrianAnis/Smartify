import Image from "next/image";

interface GoogleLoginButtonProps {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function GoogleLoginButton({ text = "Lanjutkan dengan Google", onClick, disabled }: GoogleLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-border text-card-foreground font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <Image
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google logo"
        width={20}
        height={20}
      />
      {text}
    </button>
  );
}
