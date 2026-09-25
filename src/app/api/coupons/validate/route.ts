import { NextRequest } from "next/server";
import { parseProductIds, priceCart } from "@/lib/checkout";

// Returns a full server-side price quote (lines, discount, tax, total) for the review step.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = parseProductIds(body.productIds);
    if (!ids.length) return Response.json({ error: "Add something to your bag first." }, { status: 400 });
    const pricing = await priceCart(ids, String(body.code || ""));
    if ("error" in pricing) return Response.json({ error: pricing.error }, { status: 400 });
    return Response.json({ code: pricing.coupon?.code || "", discount: pricing.discount, subtotal: pricing.subtotal, tax: pricing.tax, taxRate: pricing.taxRate, total: pricing.total, lines: pricing.lines.map((line) => ({ id: line.product.id, name: line.product.name, unitPrice: line.unitPrice })) });
  } catch { return Response.json({ error: "Could not check that code." }, { status: 500 }); }
}
