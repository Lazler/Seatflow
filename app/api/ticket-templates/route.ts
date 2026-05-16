import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { data, error } = await supabase
    .from("ticket_templates")
    .select("id, name, design, erstellt_am")
    .eq("veranstalter_id", user.id)
    .order("erstellt_am", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { name, design } = await req.json() as { name: string; design: object };

  const { data, error } = await supabase
    .from("ticket_templates")
    .insert({ veranstalter_id: user.id, name, design })
    .select("id, name, design, erstellt_am")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
