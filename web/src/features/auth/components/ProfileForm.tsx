"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { RippleButton } from "@/components/reactbits/RippleButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateProfile } from "../api/mutations";
import { type ProfileSchema, profileSchema } from "../schemas";
import { useAuthStore } from "../store";
import type { AuthUser } from "../types";

interface ProfileFormProps {
  /** 当前用户 */
  user: AuthUser;
}

/**
 * 个人资料表单
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username,
      bio: user.bio ?? "",
      avatar_url: user.avatar_url ?? "",
    },
  });

  const onSubmit = async (data: ProfileSchema) => {
    try {
      const updated = await updateProfile(data);
      setAuth({
        user: updated,
        accessToken: accessToken ?? "",
        refreshToken: refreshToken ?? "",
      });
      toast.success("个人资料已更新");
    } catch {
      toast.error("更新失败，请稍后重试");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          placeholder="请输入用户名"
          {...register("username")}
          aria-invalid={errors.username ? "true" : "false"}
        />
        {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">简介</Label>
        <Textarea
          id="bio"
          placeholder="写点什么介绍自己..."
          rows={4}
          {...register("bio")}
          aria-invalid={errors.bio ? "true" : "false"}
        />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">头像链接</Label>
        <Input
          id="avatar_url"
          placeholder="https://example.com/avatar.png"
          {...register("avatar_url")}
          aria-invalid={errors.avatar_url ? "true" : "false"}
        />
        {errors.avatar_url && (
          <p className="text-xs text-destructive">{errors.avatar_url.message}</p>
        )}
      </div>

      <RippleButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : "保存资料"}
      </RippleButton>
    </form>
  );
}
