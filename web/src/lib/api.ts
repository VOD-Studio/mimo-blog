import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import { env } from "./env";

/**
 * 全局 axios 实例
 */
export const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 判断当前是否在浏览器环境
 */
function isClient() {
  return typeof window !== "undefined";
}

/**
 * 从 localStorage 读取 access token（仅在客户端）
 */
function getAccessToken(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem("accessToken");
}

/**
 * 从 localStorage 读取 refresh token（仅在客户端）
 */
function getRefreshToken(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem("refreshToken");
}

/**
 * 持久化 token（仅在客户端）
 */
function setTokens(accessToken: string) {
  if (isClient()) {
    localStorage.setItem("accessToken", accessToken);
  }
}

/**
 * 清除认证状态（仅在客户端）
 */
function clearAuth() {
  if (isClient()) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

/**
 * 跳转到登录页（仅在客户端）
 */
function redirectToLogin() {
  if (isClient()) {
    window.location.href = "/login";
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  for (const callback of refreshSubscribers) {
    callback(token);
  }
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post(`${env.VITE_API_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken } = response.data as { accessToken: string };
        setTokens(accessToken);
        onTokenRefreshed(accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch {
        clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
