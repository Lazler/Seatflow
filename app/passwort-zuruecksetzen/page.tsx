"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Phase = "init" | "form" | "success" | "error";

export default function PasswortZuruecksetzen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("init");
  const [passwort, setPasswort] = useState("");
  const [bestaetigung, setBestaetigung] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    // Die Callback-Route (/auth/callback) hat den Reset-Code bereits gegen
    // eine Recovery-Session getauscht. Hier nur prüfen, ob die Session steht.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      setPhase(error || !data.user ? "error" : "form");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwort !== bestaetigung) {
      setFehler("Die Passwörter stimmen nicht überein.");
      return;
    }
    if (passwort.length < 8) {
      setFehler("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: passwort });

    if (error) {
      setFehler("Passwort konnte nicht gesetzt werden. Bitte fordere einen neuen Link an.");
      setLaedt(false);
      return;
    }

    setPhase("success");
    setTimeout(() => router.push("/dashboard"), 2000);
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

        {phase === "init" && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              Link wird überprüft…
            </CardContent>
          </Card>
        )}

        {phase === "error" && (
          <Card>
            <CardHeader>
              <CardTitle>Link ungültig oder abgelaufen</CardTitle>
              <CardDescription>
                Bitte fordere einen neuen Passwort-Reset-Link an.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/anmelden")}>
                Zurück zur Anmeldung
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === "form" && (
          <Card>
            <CardHeader>
              <CardTitle>Neues Passwort setzen</CardTitle>
              <CardDescription>Wähle ein sicheres Passwort (mind. 8 Zeichen).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwort">Neues Passwort</Label>
                  <Input
                    id="passwort"
                    type="password"
                    value={passwort}
                    onChange={(e) => setPasswort(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bestaetigung">Passwort bestätigen</Label>
                  <Input
                    id="bestaetigung"
                    type="password"
                    value={bestaetigung}
                    onChange={(e) => setBestaetigung(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {fehler && <p className="text-sm text-destructive">{fehler}</p>}
                <Button type="submit" className="w-full" disabled={laedt}>
                  {laedt ? "Wird gespeichert…" : "Passwort speichern"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {phase === "success" && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <p className="text-lg font-semibold">Passwort gespeichert ✓</p>
              <p className="text-sm text-muted-foreground">Du wirst zum Dashboard weitergeleitet…</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
