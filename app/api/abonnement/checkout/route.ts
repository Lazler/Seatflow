import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const Schema = z.object({
  interval: z.enum(["month", "year"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  const { interval } = parsed.data;

  const priceId = interval === "year"
    ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
    : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: "Preiskonfiguration fehlt" }, { status: 500 });
  }

  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("name, stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profil?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profil?.name ?? undefined,
      metadata: { veranstalter_id: user.id },
    });
    customerId = customer.id;
    await createAdminClient()
      .from("veranstalter_profile")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/abo?success=1`,
    cancel_url: `${appUrl}/dashboard/abo`,
    metadata: { veranstalter_id: user.id, type: "subscription" },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
