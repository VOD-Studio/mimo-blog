import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useLoginMutation } from "../hooks/useLoginMutation";
import { type LoginSchema, loginSchema } from "../schemas";

/**
 * 登录表单
 */
export function LoginForm() {
  const { mutate, isPending } = useLoginMutation();
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
      <div>
        <Label htmlFor="email">邮箱</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="password">密码</Label>
        <Input id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
