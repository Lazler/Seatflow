import { NextRequest, NextResponse } from "next/server";
import { isLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { lang } = await req.json().catch(() => ({}));
  if (!isLocale(lang)) return NextResponse.json({ error: "Ungültige Sprache" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dashboard_lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Also persist in profile if user is logged in
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("veranstalter_profile")
        .update({ sprache: lang as Locale })
        .eq("id", user.id);
    }
  } catch { /* non-critical */ }

  return res;
}
