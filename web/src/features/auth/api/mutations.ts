import { api } from "@/lib/api";
import type { PasswordSchema, ProfileSchema } from "../schemas";
import type { AuthUser, LoginInput, RegisterInput, TokenResponse } from "../types";

/**
 * 登录
 */
export async function login(data: LoginInput): Promise<TokenResponse> {
  const response = await api.post("/api/v1/auth/login", data);
  return response.data as TokenResponse;
}

/**
 * 注册
 */
export async function register(data: RegisterInput): Promise<TokenResponse> {
  const response = await api.post("/api/v1/auth/register", data);
  return response.data as TokenResponse;
}

/**
 * 获取当前用户信息
 */
export async function fetchMe(): Promise<AuthUser> {
  const response = await api.get("/api/v1/auth/me");
  return response.data as AuthUser;
}

/**
 * 刷新令牌
 */
export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const response = await api.post("/api/v1/auth/refresh", { refresh_token: refreshToken });
  return response.data as TokenResponse;
}

/**
 * 更新个人资料
 */
export async function updateProfile(data: ProfileSchema): Promise<AuthUser> {
  const response = await api.patch("/api/v1/auth/profile", {
    username: data.username,
    bio: data.bio ?? "",
    avatar_url: data.avatar_url ?? "",
  });
  return response.data as AuthUser;
}

/**
 * 修改密码
 */
export async function changePassword(data: PasswordSchema): Promise<void> {
  await api.patch("/api/v1/auth/password", {
    old_password: data.old_password,
    new_password: data.new_password,
  });
}
