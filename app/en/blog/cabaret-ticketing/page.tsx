import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Cabaret Ticketing: What Small Venues Actually Need",
  description:
    "No budget for expensive ticketing platforms? We explain which features a cabaret ticketing system must have — and which are overkill.",
  alternates: { canonical: "https://seatflow.app/en/blog/cabaret-ticketing" },
  openGraph: {
    title: "Cabaret Ticketing: What Small Venues Actually Need",
    description: "An honest guide for cabaret organisers on the topic of ticketing.",
    url: "https://seatflow.app/en/blog/cabaret-ticketing",
    type: "article",
    publishedTime: "2026-04-24",
  },
};

export default function ArticleCabaret() {
  return (
    <article>
      <Link href="/en/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All articles
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-04-24">24 April 2026</time>
          <span>·</span>
          <span>5 min read</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Cabaret</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Cabaret Ticketing: What Small Venues Actually Need
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Many cabaret organisers are put off by the apparent complexity of digital ticketing. But the barrier is much lower than expected. This article explains which features genuinely matter for small cabarets — and which can be safely ignored.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>The typical cabaret situation</h2>
        <p>
          A small cabaret usually has 40–120 seats and performs 2–4 evenings per week. Bookings often come through personal recommendation, local advertising, or a regular audience. The challenge: reservations are managed manually — by phone, e-mail or notebook — and sold out evenings are only discovered at the door.
        </p>
        <p>
          A digital ticketing system creates clarity: which seats are free, which are sold, who is coming. It also handles payment automatically, so organisers don&apos;t have to chase outstanding invoices.
        </p>

        <h2>Must-have features for cabarets</h2>

        <h3>Numbered seat plan</h3>
        <p>
          In a cabaret, the seating arrangement matters. Guests want to know whether they&apos;re sitting at the front or back, in the centre or at the side. A visual floor plan where each seat is selectable is therefore essential — not a luxury.
        </p>

        <h3>Multiple price categories</h3>
        <p>
          Reduced rates for students, advance booking discounts, premium seats in the front row: a good system allows different price categories per seat or zone, without technical complexity.
        </p>

        <h3>QR code tickets by e-mail</h3>
        <p>
          Guests expect a PDF ticket by e-mail after booking, ideally with a QR code. This saves the box office — entry can be checked with a smartphone.
        </p>

        <h3>Simple booking link</h3>
        <p>
          The booking page should be shareable: as a link in an e-mail newsletter, on Instagram or embedded on your own website. No registration for guests, no app installation.
        </p>

        <h2>What you definitely don&apos;t need</h2>
        <ul>
          <li>CRM system with automated marketing funnels</li>
          <li>Mobile app for guests</li>
          <li>Multi-currency payment processing</li>
          <li>Analytics dashboard with 30+ metrics</li>
          <li>Enterprise API for third-party integration</li>
        </ul>
        <p>
          These features inflate the price of many ticketing platforms significantly — and are simply unnecessary for a 60-seat cabaret.
        </p>

        <h2>What does it really cost?</h2>
        <p>
          The real question isn&apos;t just which features a system has, but what it costs for your specific usage:
        </p>
        <ul>
          <li><strong>Commission model:</strong> No base fee, but 8–15% per ticket as commission. At €15 ticket price and 100 tickets: €120–225 commission per month.</li>
          <li><strong>Fixed fee model:</strong> €30–60/month base fee regardless of number of shows. Often cheaper for high volumes, expensive for seasonal operations.</li>
          <li><strong>Per-ticket service charge:</strong> €0.75–1.50/ticket, no base fee. Transparent, scales with usage.</li>
        </ul>

        <h2>Conclusion: Keep it simple</h2>
        <p>
          For a small cabaret, the ideal ticketing system is one that works reliably, is easy to set up, and doesn&apos;t consume a large portion of ticket revenue. The technology should be in the background — not the focus of your work.
        </p>
        <p>
          If you&apos;re considering which platforms are available,{" "}
          <Link href="/en/blog/ticketing-comparison" className="text-primary underline underline-offset-4 hover:text-primary/80">
            our comparison of common ticketing solutions
          </Link>{" "}
          may help.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Try SeatFlow for free</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set up a floor plan, create an event, share the link. No credit card needed, cancel any time.
        </p>
        <Button asChild>
          <Link href="/register">Start free →</Link>
        </Button>
      </div>
    </article>
  );
}
