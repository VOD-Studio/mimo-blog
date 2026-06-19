import { createFileRoute, Link } from "@tanstack/react-router";

import { GlassCard } from "@/components/reactbits/GlassCard";
import { GradientText } from "@/components/reactbits/GradientText";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

/**
 * 登录页
 */
function LoginPage() {
  return (
    <GlassCard className="w-full">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          <GradientText>欢迎回来</GradientText>
        </h1>
        <p className="text-sm text-muted-foreground">请输入账号信息继续访问</p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link
          to="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          立即注册
        </Link>
      </p>
    </GlassCard>
  );
}
