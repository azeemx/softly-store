export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Softly <onboarding@resend.dev>", to: [to], subject, html }),
  });
  if (!response.ok) { console.error("Email delivery failed", await response.text()); return false; }
  return true;
}

export function emailLayout(title: string, body: string) {
  return `<div style="background:#f8f5ef;padding:40px 16px;font-family:Arial,sans-serif;color:#29483f"><div style="max-width:540px;margin:auto;background:white;padding:42px;border-radius:16px"><div style="font-family:Georgia,serif;font-size:32px;margin-bottom:28px">softly<span style="color:#d99d8e">.</span></div><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:30px">${title}</h1><div style="font-size:15px;line-height:1.7;color:#59645f">${body}</div><p style="font-size:12px;margin-top:40px;color:#8f9890">A quiet corner of the internet for becoming who you are. ♡</p></div></div>`;
}
