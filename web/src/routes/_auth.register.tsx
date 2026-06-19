import { createFileRoute, Link } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

/**
 * 注册页
 */
function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>注册</CardTitle>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-4 text-center text-sm">
          已有账号？<Link to="/login">登录</Link>
        </p>
      </CardContent>
    </Card>
  );
}
