import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_EVENT_LIMIT, effectivePlan } from "@/lib/plan";
import { z } from "zod";

const EventSchema = z.object({
  venue_id: z.string().uuid().nullable().optional(),
  titel: z.string().min(1).max(200).trim(),
  beschreibung: z.string().max(2000).trim().nullable().optional(),
  datum: z.string(),
  einlass_datum: z.string().nullable().optional(),
  ticket_preis_cent: z.number().int().nonnegative(),
  max_tickets: z.number().int().positive().nullable().optional(),
  sprachen: z.array(z.string()).min(1),
  translations: z.record(z.string(), z.object({ titel: z.string(), beschreibung: z.string() })),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const parsed = EventSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("plan, abo_bis")
    .eq("id", user.id)
    .single();

  const plan = effectivePlan(profil?.plan ?? "free", profil?.abo_bis ?? null);
  const limit = PLAN_EVENT_LIMIT[plan];

  if (limit !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("veranstalter_id", user.id)
      .gte("erstellt_am", startOfMonth.toISOString());

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `Du hast das Limit von ${limit} Events pro Monat im Free Plan erreicht.`,
          code: "PLAN_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      veranstalter_id: user.id,
      ...parsed.data,
      status: "entwurf",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Event konnte nicht gespeichert werden." }, { status: 500 });
  }

  return NextResponse.json({ id: event.id }, { status: 201 });
}
