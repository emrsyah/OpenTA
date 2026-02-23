import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "./schema";

// Validate environment variables
const requiredEnvVars = [
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

if (
  process.env.BETTER_AUTH_SECRET &&
  process.env.BETTER_AUTH_SECRET.length < 32
) {
  console.warn(
    "⚠️  BETTER_AUTH_SECRET should be at least 32 characters for security",
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],

  // Rate limiting
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 10,
    max: 100,
    customRules: {
      "/api/auth/sign-in/google": { window: 60, max: 5 },
    },
  },

  // Session security
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 300,
      strategy: "jwe",
    },
  },

  // OAuth security
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: "cookie",
  },

  // Advanced security
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      disableIpTracking: false,
    },
  },

  // Audit logging
  databaseHooks: {
    session: {
      create: {
        after: async () => {
          console.log(`[AUTH] Session created`);
        },
      },
    },
    user: {
      create: {
        after: async () => {
          console.log(`[AUTH] User registered`);
        },
      },
    },
    account: {
      create: {
        after: async () => {
          console.log(`[AUTH] Account linked`);
        },
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
