import "dotenv/config";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default("http://localhost:3001/api/v1/auth/google/callback"),
  MAIL_HOST: z.string().min(1).default("smtp.gmail.com"),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_SECURE: z.coerce.boolean().default(false),
  MAIL_USER: z.string().min(1).default("dev@worksphere.local"),
  MAIL_PASS: z.string().min(1).default("devpassword"),
  MAIL_FROM_NAME: z.string().default("WorkSphere"),
  MAIL_FROM_ADDRESS: z.string().min(1).default("noreply@worksphere.com"),
  CLIENT_URL: z.string().min(1).default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env: Env = parsed.data;
