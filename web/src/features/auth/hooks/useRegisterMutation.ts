import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { fetchMe, register } from "../api/mutations";
import { useAuthStore } from "../store";

/**
 * 注册 mutation
 *
 * 后端 register 只返回 token，成功后需再调 /auth/me 获取用户信息。
 */
export function useRegisterMutation() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (input: { username: string; email: string; password: string }) => {
      const tokenResponse = await register(input);
      useAuthStore.getState().setTokens({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      });
      const user = await fetchMe();
      return {
        user,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      };
    },
    onSuccess: (data) => {
      setAuth(data);
      toast.success("注册成功");
      navigate({ to: "/" });
    },
    onError: () => {
      useAuthStore.getState().clearAuth();
      toast.error("注册失败，请检查输入信息");
    },
  });
}
