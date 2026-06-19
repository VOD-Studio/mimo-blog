/**
 * 登录请求参数
 */
export interface LoginInput {
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
}

/**
 * 注册请求参数
 */
export interface RegisterInput {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
}

/**
 * 认证用户信息（来自 /auth/me）
 */
export interface AuthUser {
  /** 用户 ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 头像 URL */
  avatar_url?: string;
  /** 简介 */
  bio?: string;
  /** 角色 */
  role: "user" | "admin" | "superadmin";
  /** 邮箱是否已验证 */
  email_verified: boolean;
  /** 是否启用 */
  is_active: boolean;
  /** 权限码列表 */
  permissions: string[];
  /** 创建时间 */
  created_at: string;
}

/**
 * 登录/刷新响应（仅含 token）
 */
export interface TokenResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 访问令牌过期时间（秒） */
  expires_in: number;
  /** 刷新令牌过期时间（秒） */
  refresh_expires_in: number;
  /** 令牌类型 */
  token_type: string;
}
