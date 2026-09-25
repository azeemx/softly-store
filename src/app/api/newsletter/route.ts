import { NextRequest } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!rateLimit(`newsletter:${clientIp(request)}`, 5, 60 * 60 * 1000)) return Response.json({ error: "Please try again later." }, { status: 429 });
  try { const { email } = await request.json(); const normalized = String(email || "").trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) return Response.json({ error: "Please enter a valid email." }, { status: 400 }); await db.insert(newsletterSubscribers).values({ email: normalized }).onConflictDoNothing(); return Response.json({ message: "You're on the list! A little goodness is coming your way. ♡" }); } catch { return Response.json({ error: "Could not subscribe. Please try again." }, { status: 500 }); }
}
