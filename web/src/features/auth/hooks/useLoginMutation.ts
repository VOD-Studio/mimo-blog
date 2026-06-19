import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { login } from "../api/mutations";
import { useAuthStore } from "../store";

/**
 * 登录 mutation
 */
export function useLoginMutation() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      toast.success("登录成功");
      navigate({ to: "/" });
    },
    onError: () => {
      toast.error("登录失败，请检查邮箱和密码");
    },
  });
}
