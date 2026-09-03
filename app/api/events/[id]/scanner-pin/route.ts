import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoBlockiert } from "@/lib/demo";

// Erzeugt (oder erneuert) die 6-stellige Scanner-PIN eines Events.
// Nur der Veranstalter darf das; das Einlasspersonal nutzt die PIN dann
// auf /scan/[eventId] ohne eigenen Account.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const demo = demoBlockiert(user.id); if (demo) return demo;

  // 6-stellig, ohne führende Null-Probleme
  const pin = String(Math.floor(100000 + Math.random() * 900000));

  const { data, error } = await supabase
    .from("events")
    .update({ scanner_pin: pin })
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  return NextResponse.json({ pin });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const demo = demoBlockiert(user.id); if (demo) return demo;

  const { error } = await supabase
    .from("events")
    .update({ scanner_pin: null })
    .eq("id", id)
    .eq("veranstalter_id", user.id);

  if (error) return NextResponse.json({ error: "Fehler" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
