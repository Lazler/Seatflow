import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profil?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json({ error: "Kein Stripe-Kundenkonto gefunden" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/abo`,
  });

  return NextResponse.json({ url: session.url });
}
