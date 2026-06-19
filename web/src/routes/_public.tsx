import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

/**
 * 前台公共布局
 */
function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
