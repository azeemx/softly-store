import { NextRequest } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, sessions, users } from "@/db/schema";
import { clearSession, clientIp, createSession, hashPassword, hashToken, randomToken, rateLimit, verifyPassword } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { ensureSeeded } from "@/lib/store";

export const runtime = "nodejs";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const error = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!["login", "register", "logout", "forgot", "reset", "verify"].includes(action)) return error("Not found", 404);
  if (!rateLimit(`auth:${action}:${clientIp(request)}`, action === "login" ? 15 : 8)) return error("Too many attempts. Please try again later.", 429);
  try {
    await ensureSeeded();
    if (action === "logout") { await clearSession(); return Response.json({ success: true }); }
    const body = await request.json();
    if (action === "verify") {
      const token = String(body.token || "");
      const [record] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, hashToken(token)), eq(authTokens.type, "verify"), gt(authTokens.expiresAt, new Date()))).limit(1);
      if (!record) return error("This verification link is invalid or expired.");
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, record.userId));
      await db.delete(authTokens).where(eq(authTokens.id, record.id));
      return Response.json({ success: true, message: "Your email is verified." });
    }
    if (action === "reset") {
      const token = String(body.token || ""); const password = String(body.password || "");
      if (password.length < 8 || password.length > 128) return error("Choose a password of at least 8 characters.");
      const [record] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, hashToken(token)), eq(authTokens.type, "reset"), gt(authTokens.expiresAt, new Date()))).limit(1);
      if (!record) return error("This reset link is invalid or expired.");
      await db.update(users).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(users.id, record.userId));
      await db.delete(authTokens).where(and(eq(authTokens.userId, record.userId), eq(authTokens.type, "reset")));
      await db.delete(sessions).where(eq(sessions.userId, record.userId));
      await createSession(record.userId);
      return Response.json({ success: true, message: "Your password has been updated." });
    }
    const email = String(body.email || "").trim().toLowerCase();
    if (!emailPattern.test(email) || email.length > 254) return error("Please enter a valid email address.");
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (action === "forgot") {
      if (existing && process.env.RESEND_API_KEY) {
        const token = randomToken();
        await db.insert(authTokens).values({ userId: existing.id, tokenHash: hashToken(token), type: "reset", expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
        const link = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || request.nextUrl.origin}/account/reset-password?token=${token}`;
        await sendEmail(email, "Reset your Softly password", emailLayout("A fresh start for your account", `<p>Click below to set a new password. This link expires in one hour.</p><p><a href="${link}" style="color:#29483f;font-weight:bold">Reset my password →</a></p><p>If you didn't request this, you can safely ignore this email.</p>`));
      }
      return Response.json({ success: true, message: process.env.RESEND_API_KEY ? "If an account exists for this address, a reset link is on its way." : "Email delivery isn't configured in this preview. Please contact support for help." });
    }
    const password = String(body.password || "");
    if (action === "login") {
      if (!existing || existing.status !== "active" || !(await verifyPassword(password, existing.passwordHash))) return error("That email or password doesn't look right.", 401);
      await createSession(existing.id);
      return Response.json({ success: true, user: { name: existing.name, role: existing.role } });
    }
    if (existing) return error("An account with this email already exists.", 409);
    const name = String(body.name || "").trim().slice(0, 80);
    if (name.length < 2) return error("Please enter your name.");
    if (password.length < 8 || password.length > 128) return error("Choose a password of at least 8 characters.");
    const [user] = await db.insert(users).values({ name, email, passwordHash: await hashPassword(password), role: "customer", emailVerifiedAt: process.env.RESEND_API_KEY ? null : new Date() }).returning();
    if (process.env.RESEND_API_KEY) {
      const token = randomToken();
      await db.insert(authTokens).values({ userId: user.id, tokenHash: hashToken(token), type: "verify", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || request.nextUrl.origin}/account/verify?token=${token}`;
      await sendEmail(email, "Welcome to Softly — verify your email", emailLayout("Welcome to your little corner ♡", `<p>Hi ${escapeHtml(name)},</p><p>We're so glad you're here. Verify your email to finish setting up your account.</p><p><a href="${link}" style="color:#29483f;font-weight:bold">Verify my email →</a></p>`));
    }
    await createSession(user.id);
    return Response.json({ success: true, user: { name: user.name, role: user.role } });
  } catch (err) { console.error("Auth error", err); return error("Something went wrong. Please try again.", 500); }
}
