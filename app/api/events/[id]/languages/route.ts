import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sprachen, translations, titel, beschreibung } = await req.json();

  const update: Record<string, unknown> = { sprachen, translations };
  if (typeof titel === "string") {
    if (!titel.trim()) return NextResponse.json({ error: "Titel darf nicht leer sein." }, { status: 400 });
    update.titel = titel.trim();
    update.beschreibung = typeof beschreibung === "string" && beschreibung.trim() ? beschreibung.trim() : null;
  }

  const { error } = await supabase
    .from("events")
    .update(update)
    .eq("id", id)
    .eq("veranstalter_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
