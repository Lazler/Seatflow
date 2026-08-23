import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "SeatFlow Blog: Tips for Event Organisers",
  description:
    "Practical advice on ticket sales, seat management and event organisation for theatres, cabarets and comedy clubs.",
  alternates: { canonical: "https://seatflow.app/en/blog" },
};

const ARTICLES = [
  {
    slug: "sell-tickets-theater",
    title: "Sell Tickets Online for Theatres: The Complete Guide",
    teaser:
      "How small and mid-sized theatres can digitalise their ticket sales, from seat management to automatic e-mail delivery. Explained step by step.",
    date: "2026-04-10",
    readTime: "7 min",
  },
  {
    slug: "cabaret-ticketing",
    title: "Cabaret Ticketing: What Small Venues Actually Need",
    teaser:
      "No budget for expensive ticketing platforms? We explain which features a cabaret ticketing system must have, and which are overkill.",
    date: "2026-04-24",
    readTime: "5 min",
  },
  {
    slug: "comedy-club-ticketing",
    title: "Comedy Club Ticket Shop Setup: Live in One Hour",
    teaser:
      "Step by step: how comedy clubs set up their own ticket shop with numbered seats, no developer needed, no monthly fees.",
    date: "2026-05-08",
    readTime: "6 min",
  },
  {
    slug: "ticketing-comparison",
    title: "Ticketing Systems Compared: Which Fits Small Cultural Venues?",
    teaser:
      "Eventbrite, TicketTailor, pretix or custom development? We compare the most common solutions for theatres, cabarets and comedy clubs, and show what really matters.",
    date: "2026-05-15",
    readTime: "8 min",
  },
];

export default function EnBlogIndex() {
  return (
    <div>
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Tips for Event Organisers</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Practical knowledge on ticket sales, seat management and event organisation for theatres, cabarets and comedy clubs.
        </p>
      </div>

      <div className="space-y-8">
        {ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/en/blog/${a.slug}`}
            className="group block border border-border rounded-xl p-6 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <time dateTime={a.date}>
                {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <span>·</span>
              <span>{a.readTime} read</span>
            </div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{a.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{a.teaser}</p>
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
              Read more <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
