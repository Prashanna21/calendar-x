import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "calendarx_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getAuthSecret() {
  return process.env.NEXTAUTH_SECRET || "secret_secret";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, existingHash] = storedHash.split(":");
  if (!salt || !existingHash) {
    return false;
  }

  const passwordHash = scryptSync(password, salt, 64);
  const existingHashBuffer = Buffer.from(existingHash, "hex");

  if (passwordHash.length !== existingHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordHash, existingHashBuffer);
}

export function createSessionToken(userId: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [userId, expiresAtRaw, signature] = token.split(".");
  if (!userId || !expiresAtRaw || !signature) {
    return null;
  }

  const payload = `${userId}.${expiresAtRaw}`;
  const expectedSignature = createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  return { userId, expiresAt };
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  const token = createSessionToken(userId);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
