const fs = require('fs');
let c = fs.readFileSync('components/dashboard/Navbar.tsx', 'utf8');

c = c.replace(
  /interface NavbarProps \{([\s\S]*?)fullWidth\?: boolean;([\s\S]*?)\}/,
  'interface NavbarProps {$1title?: string;\n  fullWidth?: boolean;$2}'
);

c = c.replace(
  /export function Navbar\(\{ backHref, backLabel = "Kembali" \}: NavbarProps = \{\}\) \{/,
  'export function Navbar({ backHref, backLabel = "Kembali", title }: NavbarProps = {}) {'
);

const oldNav = `          {/* Left: Logo & Back Button */}
          <div className="flex flex-1 items-center justify-start">
            <Link href="/dashboard" className="flex items-center gap-2 mr-4">
              <Image
                src="/images/logo3.png"
                alt="Smartify Logo"
                width={120}
                height={40}
                priority
                className="h-7 w-auto"
              />
            </Link>
            
            {backHref && (
              <div className="hidden md:flex items-center pl-2">
                <Link
                  href={backHref}
                  className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  title={backLabel}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Link>
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation */}
          {!backHref && (`.replace(/\r\n/g, '\n');

const newNav = `          {/* Left: Back Button & Logo/Title */}
          <div className="flex flex-1 items-center justify-start gap-4">
            {backHref && (
              <Link
                href={backHref}
                className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                title={backLabel}
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
            )}
            
            {title ? (
              <h1 className="text-base md:text-lg font-bold text-foreground">
                {title}
              </h1>
            ) : (
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/images/logo3.png"
                  alt="Smartify Logo"
                  width={120}
                  height={40}
                  priority
                  className="h-7 w-auto"
                />
              </Link>
            )}
          </div>

          {/* Center: Desktop Navigation */}
          {!backHref && !title && (`.replace(/\r\n/g, '\n');

c = c.replace(/\r\n/g, '\n').replace(oldNav, newNav);
fs.writeFileSync('components/dashboard/Navbar.tsx', c);
console.log("Navbar modified!");
