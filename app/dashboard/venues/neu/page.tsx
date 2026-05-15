"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NeuesVenue() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/anmelden");
      return;
    }

    const { data, error } = await supabase
      .from("venues")
      .insert({
        veranstalter_id: user.id,
        name,
        adresse: adresse || null,
        beschreibung: beschreibung || null,
      })
      .select("id")
      .single();

    if (error) {
      setFehler("Venue konnte nicht gespeichert werden.");
      setLaedt(false);
      return;
    }

    router.push(`/dashboard/venues/${data.id}`);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/venues">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Neues Venue</h1>
          <p className="text-muted-foreground text-sm">Veranstaltungsort anlegen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Angaben zum Venue</CardTitle>
          <CardDescription>
            Du kannst den Raumplan danach im Venue-Detail anlegen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Kleines Theater am Markt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="z.B. Marktplatz 1, 80331 München"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <textarea
                id="beschreibung"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Optional: kurze Beschreibung des Ortes"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
              />
            </div>

            {fehler && <p className="text-sm text-destructive">{fehler}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={laedt}>
                {laedt ? "Wird gespeichert..." : "Venue anlegen"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/venues">Abbrechen</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
