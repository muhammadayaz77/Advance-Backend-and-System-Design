import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3001),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Google OAuth (optional – leave empty to disable Google login)
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z
    .string()
    .optional()
    .default('http://localhost:3001/api/v1/auth/google/callback'),

  // Mail (SMTP)
  MAIL_HOST: z.string().min(1, 'MAIL_HOST is required'),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_SECURE: z.coerce.boolean().default(false),
  MAIL_USER: z.string().min(1, 'MAIL_USER is required'),
  MAIL_PASS: z.string().min(1, 'MAIL_PASS is required'),
  MAIL_FROM_NAME: z.string().default('WorkSphere'),
  MAIL_FROM_ADDRESS: z.string().min(1, 'MAIL_FROM_ADDRESS is required'),

  // Frontend URL (for CORS + OAuth redirect)
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;
