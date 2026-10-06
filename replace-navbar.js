const fs = require('fs');
let c = fs.readFileSync('components/dashboard/Navbar.tsx', 'utf8');

c = c.replace(
  /<div className="hidden md:flex items-center pl-4">\s*<Link\s*href=\{backHref\}\s*className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"\s*>\s*<ArrowLeft className="h-4 w-4" \/>\s*\{backLabel\}\s*<\/Link>\s*<\/div>/g,
  `<div className="hidden md:flex items-center pl-2">
                <Link
                  href={backHref}
                  className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  title={backLabel}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Link>
              </div>`
);

fs.writeFileSync('components/dashboard/Navbar.tsx', c);
