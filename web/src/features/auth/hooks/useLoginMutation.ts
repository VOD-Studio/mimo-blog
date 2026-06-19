import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { login } from "../api/mutations";
import { useAuthStore } from "../store";

/**
 * 登录 mutation
 *
 * 后端 login 只返回 token，由 AuthProvider 在检测到 token 变化后
 * 自动调用 /auth/me 恢复用户信息，避免重复请求。
 */
export function useLoginMutation() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      toast.success("登录成功");
      navigate({ to: "/" });
    },
    onError: () => {
      useAuthStore.getState().clearAuth();
      toast.error("登录失败，请检查邮箱和密码");
    },
  });
}
