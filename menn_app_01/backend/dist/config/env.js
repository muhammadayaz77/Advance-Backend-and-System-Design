import { z } from "zod";
const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    CLIENT_URL: z.string().url().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z
        .string()
        .default("http://localhost:3001/api/v1/auth/google/callback"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default("noreply@example.com"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = parsed.data;
//# sourceMappingURL=env.js.map