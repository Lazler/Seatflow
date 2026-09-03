import Stripe from "stripe";

// `next build` evaluiert dieses Modul beim Sammeln der Seiten-Daten, bevor
// Laufzeit-Secrets zwingend gesetzt sind (z. B. auf Vercel ohne Build-Env).
// Der Stripe-Konstruktor wirft aber bei fehlendem Key → Build-Abbruch. Ein
// Platzhalter macht die Konstruktion build-sicher; zur Laufzeit greift der
// echte Key aus der Env (fehlt er dann, scheitern Stripe-Calls bewusst mit 401).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder_build_only", {
  apiVersion: "2026-04-22.dahlia",
});
