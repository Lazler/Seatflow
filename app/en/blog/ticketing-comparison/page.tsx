import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Ticketing Systems Compared: Which Fits Small Cultural Venues?",
  description:
    "Eventbrite, TicketTailor, pretix or custom development? We compare the most common solutions for theatres, cabarets and comedy clubs — and show what really matters.",
  alternates: { canonical: "https://seatflow.app/en/blog/ticketing-comparison" },
  openGraph: {
    title: "Ticketing Systems Compared: Which Fits Small Cultural Venues?",
    description: "Honest comparison of Eventbrite, TicketTailor, pretix, custom development and SeatFlow for small venues.",
    url: "https://seatflow.app/en/blog/ticketing-comparison",
    type: "article",
    publishedTime: "2026-05-15",
  },
};

export default function ArticleComparison() {
  return (
    <article>
      <Link href="/en/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All articles
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-05-15">15 May 2026</time>
          <span>·</span>
          <span>8 min read</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Comparison</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Ticketing Systems Compared: Which Fits Small Cultural Venues?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Anyone running a small theatre, cabaret or comedy club faces the same question sooner or later: which ticketing system is right? The market is opaque, pricing models are hard to compare, and large platforms aren&apos;t built for small venues. This article compares the most common options — honestly and without marketing language.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>The five most common approaches</h2>
        <p>
          Small cultural venue operators typically choose from a handful of options: well-known international platforms like Eventbrite or TicketTailor, open-source solutions like pretix, custom development — or a specialised solution built for smaller venues. Each option has genuine advantages and genuine drawbacks that depend on your specific setup.
        </p>
        <p>
          If you&apos;re wondering which core features a ticketing system for your{" "}
          <Link href="/en/blog/cabaret-ticketing" className="text-primary underline underline-offset-4 hover:text-primary/80">
            cabaret
          </Link>{" "}
          or{" "}
          <Link href="/en/blog/sell-tickets-theater" className="text-primary underline underline-offset-4 hover:text-primary/80">
            theatre
          </Link>{" "}
          should have at all, our respective guides are a good starting point.
        </p>

        <h2>Eventbrite</h2>
        <p>
          Eventbrite is the world&apos;s best-known ticketing platform and often the first port of call. Getting started is free and the platform is widely recognised — which is also a disadvantage, since guests land on the Eventbrite page, not yours. The commission model adds up quickly: up to 6.5% of the ticket price plus €0.59 per ticket goes straight to Eventbrite. On a €20 ticket that&apos;s €1.89 — around 9.5% of revenue.
        </p>
        <p>
          For larger festivals or conference organisers who want to use the Eventbrite marketplace to attract new customers, that can make sense. For a theatre or cabaret that already knows its regular audience, the commission is simply a cost centre. Furthermore, numbered seat plans are heavily restricted in the free version, and DACH-specific support is minimal.
        </p>

        <h2>TicketTailor</h2>
        <p>
          TicketTailor takes a different approach: instead of commission, organisers pay a monthly base fee from around €49. This eliminates per-ticket commission entirely — attractive at higher volumes. The platform is solid, English-language and designed for international organisers.
        </p>
        <p>
          The problem for small venues: the seat plan feature is limited to basic layouts, support is English-only, and the monthly base fee only pays off at a certain booking volume. If you only perform 3–4 times per month, you pay the base fee even in quiet months.
        </p>

        <h2>pretix</h2>
        <p>
          pretix is an open-source ticketing solution that can in principle be self-hosted for free — or used as a hosted version for a monthly fee. The project is technically mature, GDPR-compliant and offers many extension options.
        </p>
        <p>
          The catch: pretix is aimed at technically experienced users or organisations with IT resources. Setting up a self-hosted instance takes days, not hours. Managing your own server, backups and updates is not a proportionate effort for an 80-seat cabaret. The hosted version is simpler but more expensive than expected once extensions become necessary.
        </p>

        <h2>Custom development</h2>
        <p>
          Some operators consider building their own booking solution — either for maximum control or for very specific requirements. That&apos;s possible in principle, but realistically involves significant effort: 3–6 months of development time, costs from €15,000 upwards (often much more), and ongoing maintenance for updates, security and payment provider integration.
        </p>
        <p>
          For an individual theatre or{" "}
          <Link href="/en/blog/comedy-club-ticketing" className="text-primary underline underline-offset-4 hover:text-primary/80">
            comedy club
          </Link>
          , this almost never makes economic sense. Custom development is justified only when you have very specific requirements that no off-the-shelf system can meet — and when you have the long-term budget and capacity for operations and further development.
        </p>

        <h2>SeatFlow</h2>
        <p>
          SeatFlow has been developed specifically for small cultural venues. The focus is on numbered seat plans, simple setup and a transparent pricing model without commissions. The Free plan allows up to 3 events per month; the Pro plan costs €29/month with a reduced service charge.
        </p>
        <p>
          Setup typically takes under an hour: draw the floor plan, create an event, share the booking link. Support is in German (DACH focus), the platform is GDPR-compliant and designed for the requirements of small venues — not large festivals.
        </p>

        <h2>Comparison overview</h2>
        <p>
          The table below summarises the most important criteria for small venues. Ratings refer to typical usage scenarios for small venues with 40–200 seats.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto my-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-3 pr-4 font-semibold">Criterion</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">Eventbrite</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">TicketTailor</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">pretix</th>
              <th className="text-center py-3 px-3 font-semibold text-primary">SeatFlow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-3 pr-4 font-medium">Setup time</td>
              <td className="text-center py-3 px-3 text-muted-foreground">1–2 hrs</td>
              <td className="text-center py-3 px-3 text-muted-foreground">1–2 hrs</td>
              <td className="text-center py-3 px-3 text-muted-foreground">1–3 days</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">&lt; 1 hour</td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Numbered seat plans</td>
              <td className="text-center py-3 px-3 text-muted-foreground">Limited</td>
              <td className="text-center py-3 px-3 text-muted-foreground">Basic</td>
              <td className="text-center py-3 px-3"><span className="text-emerald-600 font-medium">✓</span></td>
              <td className="text-center py-3 px-3 font-semibold text-primary"><span className="text-emerald-600">✓</span> (visual)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">DACH focus</td>
              <td className="text-center py-3 px-3"><span className="text-red-500">✗</span></td>
              <td className="text-center py-3 px-3"><span className="text-red-500">✗</span></td>
              <td className="text-center py-3 px-3"><span className="text-amber-500">○</span></td>
              <td className="text-center py-3 px-3 font-semibold"><span className="text-emerald-600">✓</span></td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Free entry point</td>
              <td className="text-center py-3 px-3 text-muted-foreground"><span className="text-emerald-600">✓</span> (commission)</td>
              <td className="text-center py-3 px-3 text-muted-foreground"><span className="text-emerald-600">✓</span> (limited)</td>
              <td className="text-center py-3 px-3 text-muted-foreground"><span className="text-emerald-600">✓</span> (self-hosted)</td>
              <td className="text-center py-3 px-3 font-semibold text-primary"><span className="text-emerald-600">✓</span> (Free plan)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">Monthly base cost</td>
              <td className="text-center py-3 px-3 text-muted-foreground">€0</td>
              <td className="text-center py-3 px-3 text-muted-foreground">from €49</td>
              <td className="text-center py-3 px-3 text-muted-foreground">€0–variable</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">€0–€29</td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Per-ticket charge</td>
              <td className="text-center py-3 px-3 text-muted-foreground">6.5% + €0.59</td>
              <td className="text-center py-3 px-3 text-muted-foreground">€0 (in plan)</td>
              <td className="text-center py-3 px-3 text-muted-foreground">variable</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">€0.75–€1.50</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">Language / support</td>
              <td className="text-center py-3 px-3 text-muted-foreground">EN</td>
              <td className="text-center py-3 px-3 text-muted-foreground">EN</td>
              <td className="text-center py-3 px-3 text-muted-foreground">DE/EN</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">DE (DACH)</td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Setup effort</td>
              <td className="text-center py-3 px-3 text-muted-foreground">Low</td>
              <td className="text-center py-3 px-3 text-muted-foreground">Low</td>
              <td className="text-center py-3 px-3 text-muted-foreground">High</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">Low</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">

        <h2>Conclusion: the decision depends on your profile</h2>
        <p>
          There is no universally best ticketing solution. The choice depends on how often you perform, whether you&apos;re targeting a regular audience or new visitors, whether numbered seat plans are needed, and what budget you&apos;re prepared to invest.
        </p>
        <p>
          Small cultural venues have specific requirements that international platforms don&apos;t always cover well: GDPR-compliant processes, German-language support and seat plans for manageable halls. Those with these requirements who want to go live quickly often find the easiest path with a specialised solution.
        </p>
        <p>
          Whatever system you choose: test it thoroughly with a real ticket purchase before publishing the booking page. That applies to every platform.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Try SeatFlow free of charge</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Draw a floor plan, create an event, share the booking link — no credit card, no monthly fees. The Free plan is enough for seasonal operations.
        </p>
        <Button asChild>
          <Link href="/register">Start free →</Link>
        </Button>
      </div>
    </article>
  );
}
