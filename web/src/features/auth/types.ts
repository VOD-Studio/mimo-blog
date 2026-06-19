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
 * 认证用户信息
 */
export interface AuthUser {
  /** 用户 ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 头像 URL */
  avatar?: string;
  /** 角色 */
  role: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 用户信息 */
  user: AuthUser;
}
