import { z } from "zod";

const envSchema = z.object({
  // Server-side variables
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Client-side variables
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_BACKEND_URL: z.string().url().optional().default("http://localhost:8000"),
});

// Validate environment variables
export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      console.error("❌ Invalid environment variables:", missingVars);
      throw new Error(
        `Environment validation failed:\n${missingVars
          .map(
            (v: { path: string; message: string }) =>
              `  - ${v.path}: ${v.message}`,
          )
          .join("\n")}`,
      );
    }
    throw error;
  }
};

// Export validated env (call validateEnv() during app initialization)
export const env = process.env.SKIP_ENV_VALIDATION
  ? (process.env as z.infer<typeof envSchema>)
  : validateEnv();
