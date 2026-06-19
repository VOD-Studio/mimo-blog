import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { ShinyText } from "@/components/reactbits/ShinyText";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordForm } from "@/features/auth/components/PasswordForm";
import { ProfileForm } from "@/features/auth/components/ProfileForm";
import { useAuthStore } from "@/features/auth/store";

export const Route = createFileRoute("/_public/profile")({
  component: ProfilePage,
});

/**
 * 个人资料页
 */
function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (isInitialized && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [isInitialized, user, navigate]);

  if (!isInitialized || !user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          <ShinyText>个人资料</ShinyText>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">管理你的账户信息与密码</p>
      </div>

      <div className="space-y-6">
        <SpotlightCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">基本信息</h2>
          <ProfileForm user={user} />
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">修改密码</h2>
          <PasswordForm />
        </SpotlightCard>
      </div>
    </div>
  );
}
