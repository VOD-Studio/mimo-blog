import { createFileRoute, Link } from "@tanstack/react-router";

import { ShinyText } from "@/components/reactbits/ShinyText";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

/**
 * 注册页
 */
function RegisterPage() {
  return (
    <SpotlightCard className="w-full p-8">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          <ShinyText>创建账号</ShinyText>
        </h1>
        <p className="text-sm text-muted-foreground">填写下方信息开启博客之旅</p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          立即登录
        </Link>
      </p>
    </SpotlightCard>
  );
}
