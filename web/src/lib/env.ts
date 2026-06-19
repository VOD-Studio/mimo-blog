import { z } from "zod";

/**
 * 客户端环境变量校验 schema
 *
 * 所有以 VITE_ 开头的变量在构建时注入，业务代码必须通过 env 访问。
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SERVER_ORIGIN: z.string().url().optional(),
  VITE_SITE_URL: z.string().url().optional(),
  VITE_GITHUB_TOKEN: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.enum(["true", "false"]).optional().default("false"),
});

/**
 * 经过校验的环境变量对象
 */
export const env = envSchema.parse(import.meta.env);

/**
 * 环境变量类型
 */
export type Env = z.infer<typeof envSchema>;
