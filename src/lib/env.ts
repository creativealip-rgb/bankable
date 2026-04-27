import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(), // Optional if provided via env but good to track
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  EMAIL_PROVIDER: z.enum(["RESEND", "NODEMAILER", "CONSOLE"]).default("CONSOLE"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const isTest = process.env.NODE_ENV === "test";

const _env = envSchema.safeParse(process.env);

if (!_env.success && !isTest) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.success 
  ? _env.data 
  : (process.env as unknown as z.infer<typeof envSchema>);
