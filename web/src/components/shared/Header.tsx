import { Link } from "@tanstack/react-router";

import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/blog", label: "博客" },
  { to: "/projects", label: "项目" },
  { to: "/music", label: "音乐" },
  { to: "/about", label: "关于" },
];

/**
 * 前台顶部导航
 */
export function Header() {
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? "Mimo";

  return (
    <header className="sticky top-0 z-50 px-4 py-3">
      <div className="container mx-auto">
        <div className="flex h-14 items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 shadow-sm backdrop-blur-xl">
          <Link to="/" className="text-xl font-bold tracking-tight">
            {siteName}
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="ml-2 border-l border-border/50 pl-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
