import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// POST /api/stripe/connect — start onboarding (create or reuse account)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profil } = await admin
    .from("veranstalter_profile")
    .select("stripe_account_id, name")
    .eq("id", user.id)
    .single();

  let accountId = profil?.stripe_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "DE",
      email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { name: profil?.name ?? undefined },
      metadata: { veranstalter_id: user.id },
    });
    accountId = account.id;

    await admin
      .from("veranstalter_profile")
      .update({ stripe_account_id: accountId, stripe_connect_onboarded: false })
      .eq("id", user.id);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/api/stripe/connect/refresh`,
    return_url: `${APP_URL}/dashboard/abo?connect=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

// GET /api/stripe/connect — check status
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profil } = await admin
    .from("veranstalter_profile")
    .select("stripe_account_id, stripe_connect_onboarded")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    accountId: profil?.stripe_account_id ?? null,
    onboarded: profil?.stripe_connect_onboarded ?? false,
  });
}
