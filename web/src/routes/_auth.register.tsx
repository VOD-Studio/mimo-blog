import { createFileRoute, Link } from "@tanstack/react-router";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { GradientText } from "@/components/reactbits/GradientText";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

/**
 * 注册页
 */
function RegisterPage() {
  return (
    <BentoCard className="w-full p-8">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          <GradientText>创建账号</GradientText>
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
    </BentoCard>
  );
}
