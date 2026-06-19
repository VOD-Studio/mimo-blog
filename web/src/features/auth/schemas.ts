import { z } from "zod";

/**
 * 登录表单校验
 */
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(6, "密码至少 6 位"),
});

/**
 * 注册表单校验
 */
export const registerSchema = z
  .object({
    username: z.string().min(2, "用户名至少 2 位"),
    email: z.string().email("请输入有效的邮箱"),
    password: z.string().min(6, "密码至少 6 位"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

/**
 * 登录表单类型
 */
export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * 注册表单类型
 */
export type RegisterSchema = z.infer<typeof registerSchema>;
