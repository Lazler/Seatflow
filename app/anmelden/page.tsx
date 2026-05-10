"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Anmelden() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });

    if (error) {
      setFehler("E-Mail oder Passwort ungültig.");
      setLaedt(false);
      return;
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
            <CardTitle>Willkommen zurück</CardTitle>
            <CardDescription>Melde dich mit deiner E-Mail an</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {fehler && (
                <p className="text-sm text-destructive">{fehler}</p>
              )}

              <Button type="submit" className="w-full" disabled={laedt}>
                {laedt ? "Anmelden..." : "Anmelden"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Noch kein Konto?{" "}
              <Link href="/registrieren" className="text-primary hover:underline">
                Kostenlos registrieren
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
