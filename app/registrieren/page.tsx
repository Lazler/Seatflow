"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Registrieren() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwort,
      options: { data: { name } },
    });

    if (error) {
      setFehler(error.message);
      setLaedt(false);
      return;
    }

    if (data.user) {
      const { error: profilFehler } = await supabase.from("veranstalter_profile").insert({
        id: data.user.id,
        name,
        slug: `${slug}-${data.user.id.slice(0, 6)}`,
      });

      if (profilFehler) {
        setFehler("Profil konnte nicht erstellt werden.");
        setLaedt(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SF</span>
          </div>
          <span className="font-semibold text-lg">SeatFlow</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Konto erstellen</CardTitle>
            <CardDescription>Starte kostenlos – kein Setup nötig</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name / Organisation</Label>
                <Input
                  id="name"
                  placeholder="Theater am Marktplatz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@theater.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwort">Passwort</Label>
                <Input
                  id="passwort"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {fehler && <p className="text-sm text-destructive">{fehler}</p>}

              <Button type="submit" className="w-full" disabled={laedt}>
                {laedt ? "Konto wird erstellt..." : "Kostenlos starten"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Bereits ein Konto?{" "}
              <Link href="/anmelden" className="text-primary hover:underline">
                Anmelden
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
