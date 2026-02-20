import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      enable: true,
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});

export const signInGoogle = async () => {
  await authClient.signIn.social({
    provider: "google",
  });
};

export const signOut = async () => {
  await authClient.signOut();
};
