import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Sell Tickets Online for Theatres: The Complete Guide",
  description:
    "How small and mid-sized theatres can digitalise their ticket sales — from seat management to automatic e-mail delivery. Explained step by step.",
  alternates: { canonical: "https://seatflow.app/en/blog/sell-tickets-theater" },
  openGraph: {
    title: "Sell Tickets Online for Theatres: The Complete Guide",
    description: "A guide to digitalising ticket sales for theatres and performance venues.",
    url: "https://seatflow.app/en/blog/sell-tickets-theater",
    type: "article",
    publishedTime: "2026-04-10",
  },
};

export default function ArticleTheater() {
  return (
    <article>
      <Link href="/en/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All articles
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-04-10">10 April 2026</time>
          <span>·</span>
          <span>7 min read</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Theatre</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Sell Tickets Online for Theatres: The Complete Guide
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Many small theatres still sell tickets by phone, e-mail or at the box office. This costs time and nerves. This guide shows how to switch to digital ticket sales in a few hours — no IT knowledge required, no expensive agency needed.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>Why digital ticket sales for theatres?</h2>
        <p>
          A small theatre with 120 seats playing three times a week handles thousands of bookings per season. If every booking means a phone call or e-mail, that ties up significant resources — and puts off guests who want to book spontaneously.
        </p>
        <p>
          Modern ticket shops solve this: guests choose their seat, pay online, and receive their ticket instantly by e-mail. For the theatre, manual reservation management disappears entirely.
        </p>

        <h2>The three most important requirements for theatre tickets</h2>

        <h3>1. Numbered seats</h3>
        <p>
          Unlike concerts or festivals, theatres almost always have fixed seating. Guests want to choose <em>their</em> seat — not just book a category. A good theatre ticketing system therefore shows an interactive floor plan where available seats are visible.
        </p>

        <h3>2. Automatic ticket delivery</h3>
        <p>
          After purchase, the ticket should arrive instantly by e-mail as a PDF — with a QR code for entry. This saves the theatre box office work and gives guests peace of mind.
        </p>

        <h3>3. No monthly base fees</h3>
        <p>
          Small theatres don&apos;t perform year-round. A platform with high base fees and commission markups makes no sense when only 3–4 productions are shown per season. Better: a model with a pure per-ticket fee and no fixed costs.
        </p>

        <h2>Step by step: Building your own ticket shop</h2>
        <ol>
          <li><strong>Map the floor plan digitally</strong> — Most systems offer a visual editor where you position rows and seats. For a typical theatre auditorium this takes 30–60 minutes.</li>
          <li><strong>Define price categories</strong> — Stalls, balcony, box, concession: each seat can be assigned to a category with its own price.</li>
          <li><strong>Create the event</strong> — Enter title, date, description and optionally a booking deadline.</li>
          <li><strong>Share the link</strong> — You receive the booking page as a link to embed on your website or send directly.</li>
        </ol>

        <h2>Common mistakes when starting out</h2>
        <ul>
          <li><strong>Choosing overly complex systems:</strong> For a 100-seat theatre you don&apos;t need an enterprise solution with CRM integration.</li>
          <li><strong>Underestimating commission:</strong> Some providers take 10–15% per ticket as commission. On an €18 ticket that&apos;s up to €2.70 — more than a monthly base fee.</li>
          <li><strong>No testing before launch:</strong> Buy at least one test ticket through the entire process before publishing the booking page.</li>
        </ul>

        <h2>Cost overview</h2>
        <p>
          Actual costs depend heavily on the model. A theatre with 80 seats that sells out 3 shows per month (240 tickets) pays:
        </p>
        <ul>
          <li>With <strong>commission model (10%)</strong> at €18 ticket price: ~€432/month</li>
          <li>With <strong>base fee + service charge</strong> (e.g. €29/month + €0.75/ticket): ~€209/month</li>
          <li>With <strong>pure service charge</strong> (€1.50/ticket): ~€360/month, no monthly base cost</li>
        </ul>
        <p>
          SeatFlow works without commission: Free plan at €1.50/ticket, Pro plan from €29/month at €0.75/ticket.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Try SeatFlow — free of charge</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Draw a floor plan, create an event, share the booking link. No credit card, no cancellation needed.
        </p>
        <Button asChild>
          <Link href="/register">Start free →</Link>
        </Button>
      </div>
    </article>
  );
}
