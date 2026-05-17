"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Ansicht = "login" | "reset-anfrage" | "reset-gesendet";

export default function Anmelden() {
  const router = useRouter();
  const [ansicht, setAnsicht] = useState<Ansicht>("login");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function handleLogin(e: React.FormEvent) {
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

  async function handleResetAnfrage(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/passwort-zuruecksetzen`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLaedt(false);
    if (error) {
      setFehler("Fehler beim Senden der E-Mail. Bitte versuche es erneut.");
      return;
    }
    setAnsicht("reset-gesendet");
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

        {ansicht === "login" && (
          <Card>
            <CardHeader>
              <CardTitle>Willkommen zurück</CardTitle>
              <CardDescription>Melde dich mit deiner E-Mail an</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwort">Passwort</Label>
                    <button
                      type="button"
                      onClick={() => { setFehler(null); setAnsicht("reset-anfrage"); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <Input
                    id="passwort"
                    type="password"
                    value={passwort}
                    onChange={(e) => setPasswort(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {fehler && <p className="text-sm text-destructive">{fehler}</p>}

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
        )}

        {ansicht === "reset-anfrage" && (
          <Card>
            <CardHeader>
              <CardTitle>Passwort zurücksetzen</CardTitle>
              <CardDescription>
                Gib deine E-Mail-Adresse ein — du erhältst einen Link zum Zurücksetzen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetAnfrage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-Mail</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@theater.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                {fehler && <p className="text-sm text-destructive">{fehler}</p>}
                <Button type="submit" className="w-full" disabled={laedt}>
                  {laedt ? "Wird gesendet…" : "Reset-Link senden"}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => { setFehler(null); setAnsicht("login"); }}
                className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Zurück zur Anmeldung
              </button>
            </CardContent>
          </Card>
        )}

        {ansicht === "reset-gesendet" && (
          <Card>
            <CardHeader>
              <CardTitle>E-Mail verschickt ✓</CardTitle>
              <CardDescription>
                Schau in dein Postfach ({email}) — der Link ist 1 Stunde gültig.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAnsicht("login")}
              >
                Zurück zur Anmeldung
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
