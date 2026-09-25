import { NextRequest } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!rateLimit(`contact:${clientIp(request)}`, 4, 60 * 60 * 1000)) return Response.json({ error: "Please try again a little later." }, { status: 429 });
  try {
    const body = await request.json(); const name = String(body.name || "").trim().slice(0, 100); const email = String(body.email || "").trim().toLowerCase().slice(0, 254); const subject = String(body.subject || "General inquiry").trim().slice(0, 120); const message = String(body.message || "").trim().slice(0, 5000);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return Response.json({ error: "Please fill in your name, email, and a message of at least 10 characters." }, { status: 400 });
    await db.insert(contactMessages).values({ name, email, subject, message });
    const settings = await getSettings();
    if (process.env.RESEND_API_KEY) {
      await Promise.allSettled([
        sendEmail(email, "We got your note ♡ — Softly", emailLayout("Thanks for reaching out", `<p>Hi ${escapeHtml(name)},</p><p>Your message landed safely in our inbox. We'll get back to you as soon as we can.</p>`)),
        sendEmail(settings.supportEmail, `New message: ${escapeHtml(subject)}`, emailLayout("A new note arrived", `<p>From ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`)),
      ]);
    }
    return Response.json({ message: "Your message is on its way. We'll be in touch soon! ♡" });
  } catch (error) { console.error("Contact error", error); return Response.json({ error: "We couldn't send your message. Please try again." }, { status: 500 }); }
}
