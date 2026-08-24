import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { id } = await params;
  await stripe.coupons.del(id);
  return NextResponse.json({ ok: true });
}
