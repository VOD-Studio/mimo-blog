import { api } from "@/lib/api";

import type { LoginInput, LoginResponse, RegisterInput } from "../types";

/**
 * 登录
 */
export async function login(data: LoginInput): Promise<LoginResponse> {
  const response = await api.post("/auth/login", data);
  return response.data as LoginResponse;
}

/**
 * 注册
 */
export async function register(data: RegisterInput): Promise<LoginResponse> {
  const response = await api.post("/auth/register", data);
  return response.data as LoginResponse;
}

/**
 * 获取当前用户信息
 */
export async function fetchMe(): Promise<LoginResponse["user"]> {
  const response = await api.get("/auth/me");
  return response.data as LoginResponse["user"];
}
