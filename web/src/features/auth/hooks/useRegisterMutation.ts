import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { register } from "../api/mutations";
import { useAuthStore } from "../store";

/**
 * 注册 mutation
 *
 * 后端 register 只返回 token，由 AuthProvider 在检测到 token 变化后
 * 自动调用 /auth/me 恢复用户信息，避免重复请求。
 */
export function useRegisterMutation() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      toast.success("注册成功");
      navigate({ to: "/" });
    },
    onError: () => {
      useAuthStore.getState().clearAuth();
      toast.error("注册失败，请检查输入信息");
    },
  });
}
