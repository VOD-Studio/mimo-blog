import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { RippleButton } from "@/components/reactbits/RippleButton";
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
    <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          className="h-11 bg-background/50 backdrop-blur-sm dark:bg-background/50"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="h-11 bg-background/50 backdrop-blur-sm dark:bg-background/50"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <RippleButton
        type="submit"
        disabled={isPending}
        className="w-full h-11 text-base shadow-lg shadow-primary/25"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            登录中
          </>
        ) : (
          "登录"
        )}
      </RippleButton>
    </form>
  );
}
