import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "softly_session";
const SESSION_DAYS = 30;

export function randomToken() { return randomBytes(32).toString("hex"); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    const [salt, original] = stored.split(":");
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(original, "hex");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch { return false; }
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await db.select({ user: users }).from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.status, "active"))).limit(1);
  return result[0]?.user ?? null;
}

export async function getAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export function accessKeyForOrder(orderId: string) {
  const secret = process.env.DOWNLOAD_SECRET || process.env.STRIPE_SECRET_KEY || process.env.DATABASE_URL;
  if (!secret) throw new Error("A server secret is required");
  const key = createHash("sha256").update(secret).digest();
  return createHmac("sha256", key).update(`softly-order:${orderId}`).digest("hex");
}

export function isDemoMode() { return !process.env.STRIPE_SECRET_KEY && process.env.ENABLE_DEMO_CHECKOUT !== "false"; }

const attempts = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.reset < now) { attempts.set(key, { count: 1, reset: now + windowMs }); return true; }
  current.count++;
  return current.count <= max;
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
