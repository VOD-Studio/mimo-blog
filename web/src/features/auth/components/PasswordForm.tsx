"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { RippleButton } from "@/components/reactbits/RippleButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changePassword } from "../api/mutations";
import { type PasswordSchema, passwordSchema } from "../schemas";

/**
 * 修改密码表单
 */
export function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordSchema) => {
    try {
      await changePassword(data);
      reset();
      toast.success("密码已修改，请重新登录");
    } catch {
      toast.error("修改失败，请检查原密码是否正确");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="old_password">原密码</Label>
        <Input
          id="old_password"
          type="password"
          placeholder="请输入原密码"
          {...register("old_password")}
          aria-invalid={errors.old_password ? "true" : "false"}
        />
        {errors.old_password && (
          <p className="text-xs text-destructive">{errors.old_password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_password">新密码</Label>
        <Input
          id="new_password"
          type="password"
          placeholder="请输入新密码"
          {...register("new_password")}
          aria-invalid={errors.new_password ? "true" : "false"}
        />
        {errors.new_password && (
          <p className="text-xs text-destructive">{errors.new_password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">确认新密码</Label>
        <Input
          id="confirm_password"
          type="password"
          placeholder="请再次输入新密码"
          {...register("confirm_password")}
          aria-invalid={errors.confirm_password ? "true" : "false"}
        />
        {errors.confirm_password && (
          <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
        )}
      </div>

      <RippleButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "修改中..." : "修改密码"}
      </RippleButton>
    </form>
  );
}
