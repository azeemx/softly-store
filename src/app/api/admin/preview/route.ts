import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Toggles the admin "preview draft" cookie.
 *   GET /api/admin/preview      -> enter preview (draft merged into the storefront for admins)
 *   GET /api/admin/preview?off=1 -> exit preview (live settings again)
 * Admin-only. Plain GET so it can be linked straight from the dashboard.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const off = request.nextUrl.searchParams.get("off") === "1";
  const response = NextResponse.redirect(new URL(off ? "/admin?tab=content" : "/", request.url), 303);
  response.cookies.set("softly_preview", off ? "" : "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: off ? 0 : 60 * 60 * 6,
  });
  return response;
}
