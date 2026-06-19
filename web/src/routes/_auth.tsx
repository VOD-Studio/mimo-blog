import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

/**
 * 认证页布局，无 Header/Footer
 */
function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Outlet />
    </div>
  );
}
