import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRegisterMutation } from "../hooks/useRegisterMutation";
import { type RegisterSchema, registerSchema } from "../schemas";

/**
 * 注册表单
 */
export function RegisterForm() {
  const { mutate, isPending } = useRegisterMutation();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <form
      onSubmit={form.handleSubmit(({ username, email, password }) =>
        mutate({ username, email, password }),
      )}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="username">用户名</Label>
        <Input id="username" {...form.register("username")} />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
        )}
      </div>
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
      <div>
        <Label htmlFor="confirmPassword">确认密码</Label>
        <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "注册中..." : "注册"}
      </Button>
    </form>
  );
}
