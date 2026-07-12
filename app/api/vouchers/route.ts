import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const coupons = await stripe.coupons.list({ limit: 100 });
  const promoCodes = await stripe.promotionCodes.list({ limit: 100, active: true });

  const promoMap = new Map<string, string[]>();
  for (const pc of promoCodes.data) {
    const promotion = pc.promotion as unknown as { coupon?: { id: string } };
    const cid = promotion?.coupon?.id;
    if (!cid) continue;
    if (!promoMap.has(cid)) promoMap.set(cid, []);
    promoMap.get(cid)!.push(pc.code ?? "");
  }

  const result = coupons.data.map((c) => ({
    id: c.id,
    name: c.name ?? "",
    rabatt: c.percent_off != null
      ? { typ: "prozent" as const, wert: c.percent_off }
      : { typ: "fest" as const, wert: (c.amount_off ?? 0) / 100 },
    gueltig_bis: c.redeem_by ? new Date(c.redeem_by * 1000).toISOString() : null,
    max_einloesungen: c.max_redemptions ?? null,
    eingeloest: c.times_redeemed,
    aktiv: c.valid,
    codes: promoMap.get(c.id) ?? [],
    erstellt_am: new Date(c.created * 1000).toISOString(),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { name, rabattTyp, rabattWert, code, gueltigBisDatum, maxEinloesungen } = await req.json() as {
    name: string;
    rabattTyp: "prozent" | "fest";
    rabattWert: number;
    code: string;
    gueltigBisDatum?: string;
    maxEinloesungen?: number;
  };

  if (!name?.trim() || !code?.trim() || !rabattWert) {
    return NextResponse.json({ error: "Name, Code und Rabattwert sind erforderlich." }, { status: 400 });
  }

  const couponParams: Parameters<typeof stripe.coupons.create>[0] = {
    name: name.trim(),
    currency: "eur",
    ...(rabattTyp === "prozent"
      ? { percent_off: Math.min(100, Math.max(1, rabattWert)) }
      : { amount_off: Math.round(rabattWert * 100) }),
    ...(gueltigBisDatum ? { redeem_by: Math.floor(new Date(gueltigBisDatum).getTime() / 1000) } : {}),
    ...(maxEinloesungen ? { max_redemptions: maxEinloesungen } : {}),
  };

  const coupon = await stripe.coupons.create(couponParams);

  await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: code.trim().toUpperCase(),
  });

  return NextResponse.json({ id: coupon.id });
}
