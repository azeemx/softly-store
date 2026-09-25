import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productImages } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { adminError, audit } from "@/lib/admin";
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403); const { id } = await params; if (!/^[0-9a-f-]{36}$/i.test(id)) return adminError("Invalid ID"); await db.delete(productImages).where(eq(productImages.id, id)); await audit(admin.id, "delete", "preview", id); return Response.json({ success: true }); }
