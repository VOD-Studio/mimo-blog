import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

/**
 * 前台页脚
 */
export function Footer() {
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? "Mimo Blog";

  return (
    <footer className="container mx-auto px-4 py-8">
      <div className="rounded-2xl border border-border/60 bg-muted/70 p-6 backdrop-blur-xl dark:bg-card/70">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
