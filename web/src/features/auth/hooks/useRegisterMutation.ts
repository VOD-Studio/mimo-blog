import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { register } from "../api/mutations";
import { useAuthStore } from "../store";

/**
 * 注册 mutation
 */
export function useRegisterMutation() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      toast.success("注册成功");
      navigate({ to: "/" });
    },
    onError: () => {
      toast.error("注册失败，请检查输入信息");
    },
  });
}
