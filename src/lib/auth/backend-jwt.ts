import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BACKEND_API_SECRET || process.env.BETTER_AUTH_SECRET,
);

export interface BackendJWTPayload {
  sub: string; // user_id
  email: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * Generate a short-lived JWT for backend authentication
 * Valid for 5 minutes
 */
export async function generateBackendToken(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + 5 * 60, // 5 minutes
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a backend JWT token
 */
export async function verifyBackendToken(
  token: string,
): Promise<BackendJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as BackendJWTPayload;
  } catch (error) {
    return null;
  }
}
