import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Stripe redirects here when the onboarding link expires — generate a new one
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${APP_URL}/login`);

  const admin = createAdminClient();
  const { data: profil } = await admin
    .from("veranstalter_profile")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  const accountId = profil?.stripe_account_id as string | null;
  if (!accountId) return NextResponse.redirect(`${APP_URL}/dashboard/subscription`);

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/api/stripe/connect/refresh`,
    return_url: `${APP_URL}/dashboard/subscription?connect=success`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(accountLink.url);
}
