"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/layout/logo";

export default function Registrieren() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [emailBestaetigen, setEmailBestaetigen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    // Das veranstalter_profile wird server-seitig per DB-Trigger
    // (handle_neuer_user) angelegt — kein Client-Insert nötig.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwort,
      options: {
        data: { name },
        // Bestätigungslink landet auf der Callback-Route, die den Code gegen
        // eine Session tauscht und dann ins Dashboard weiterleitet.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      // Bekannte Fälle freundlich übersetzen, sonst generisch bleiben
      const m = error.message.toLowerCase();
      setFehler(
        m.includes("already registered") || m.includes("already been registered")
          ? "Diese E-Mail ist bereits registriert. Melde dich an oder setze dein Passwort zurück."
          : m.includes("password")
            ? "Das Passwort ist zu schwach, bitte wähle ein längeres."
            : "Registrierung fehlgeschlagen. Bitte versuche es erneut."
      );
      setLaedt(false);
      return;
    }

    // Ist E-Mail-Bestätigung aktiv, gibt es noch keine Session → nicht ins
    // Dashboard leiten, sondern zur Bestätigung auffordern. (Bei bereits
    // existierenden Adressen liefert Supabase identities: [] — gleiche Ansicht,
    // damit keine Konten-Enumeration möglich ist.)
    if (!data.session) {
      setEmailBestaetigen(true);
      setLaedt(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" />
        </div>

        {emailBestaetigen ? (
          <Card>
            <CardHeader>
              <CardTitle>Fast geschafft</CardTitle>
              <CardDescription>Bestätige deine E-Mail-Adresse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Wir haben dir eine Bestätigungs-E-Mail an <span className="font-medium text-foreground">{email}</span> geschickt.
                Klicke den Link darin, um dein Konto zu aktivieren und dich anzumelden.
              </p>
              <p className="text-xs text-muted-foreground">
                Keine E-Mail erhalten? Sieh im Spam-Ordner nach.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Zur Anmeldung</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card>
          <CardHeader>
            <CardTitle>Konto erstellen</CardTitle>
            <CardDescription>Starte kostenlos, kein Setup nötig</CardDescription>
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
              <Link href="/login" className="text-primary hover:underline">
                Anmelden
              </Link>
            </p>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
