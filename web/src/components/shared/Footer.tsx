import { Link } from "@tanstack/react-router";

import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

const links = [
  { to: "/blog", label: "博客" },
  { to: "/projects", label: "项目" },
  { to: "/music", label: "音乐" },
  { to: "/about", label: "关于" },
];

/**
 * 前台页脚
 */
export function Footer() {
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? "Mimo Blog";

  return (
    <footer className="container mx-auto px-4 py-8">
      <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/40">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="text-lg font-bold">
            {siteName}
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
