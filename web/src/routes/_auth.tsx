import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AuroraBackground } from "@/components/reactbits/AuroraBackground";
import { ParticleBackground } from "@/components/reactbits/ParticleBackground";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

/**
 * 认证页布局：沉浸式 Aurora + 粒子背景，无 Header/Footer
 */
function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <AuroraBackground className="opacity-60" />
      <ParticleBackground quantity={40} staticity={80} />
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
