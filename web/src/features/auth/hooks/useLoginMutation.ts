import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { fetchMe, login } from "../api/mutations";
import { useAuthStore } from "../store";

/**
 * 登录 mutation
 *
 * 后端 login 只返回 token，成功后需再调 /auth/me 获取用户信息。
 */
export function useLoginMutation() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const tokenResponse = await login(input);
      // 设置 token 后才能通过 /auth/me 的认证
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
      toast.success("登录成功");
      navigate({ to: "/" });
    },
    onError: () => {
      useAuthStore.getState().clearAuth();
      toast.error("登录失败，请检查邮箱和密码");
    },
  });
}
