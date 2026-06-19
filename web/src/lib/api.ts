import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import { env } from "./env";

/**
 * 后端统一响应信封
 */
export interface ApiResponse<T> {
  /** 业务数据 */
  data: T;
  /** 元信息（消息、分页等） */
  meta?: {
    message?: string;
    pagination?: PaginationMeta;
  };
}

/**
 * 分页元信息
 */
export interface PaginationMeta {
  /** 当前页 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总条数 */
  total: number;
  /** 总页数 */
  total_pages: number;
  /** 是否还有更多 */
  has_more: boolean;
}

/**
 * 列表响应结构
 */
export interface ListResponse<T> {
  /** 数据列表 */
  data: T[];
  /** 分页元信息 */
  meta: { pagination: PaginationMeta };
}

/**
 * 判断请求是否需要解包后端统一信封
 */
function shouldUnpackEnvelope(url?: string): boolean {
  if (!url) return false;
  return url.startsWith("/api/v1");
}

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
function setAccessToken(accessToken: string) {
  if (isClient()) {
    localStorage.setItem("accessToken", accessToken);
  }
}

/**
 * 持久化 refresh token（仅在客户端）
 */
function setRefreshToken(refreshToken: string) {
  if (isClient()) {
    localStorage.setItem("refreshToken", refreshToken);
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
 *
 * 优先使用 TanStack Router 客户端导航，避免整页刷新；
 * 不可用时回退到 window.location.href。
 */
function redirectToLogin() {
  if (!isClient()) return;

  // 已在认证页则不再跳转
  const pathname = window.location.pathname;
  if (pathname === "/login" || pathname === "/register") return;

  // 尝试通过 TanStack Start 挂载在 window 上的 router 实例做无刷新导航
  const router = (
    window as Window & { __TSR_ROUTER__?: { navigate: (opts: { to: string }) => void } }
  ).__TSR_ROUTER__;

  if (router?.navigate) {
    router.navigate({ to: "/login" });
  } else {
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
  (response) => {
    if (shouldUnpackEnvelope(response.config.url)) {
      const envelope = response.data as ApiResponse<unknown>;
      response.data = envelope.data;
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
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
        const response = await axios.post<
          ApiResponse<{ access_token: string; refresh_token?: string }>
        >(`${env.VITE_API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = response.data.data;
        setAccessToken(access_token);
        if (refresh_token) {
          setRefreshToken(refresh_token);
        }
        onTokenRefreshed(access_token);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
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
