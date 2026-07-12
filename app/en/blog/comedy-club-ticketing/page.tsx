import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Comedy Club Ticket Shop Setup: Live in One Hour",
  description:
    "Step-by-step guide: set up a comedy club ticket shop with numbered seats, online payment and automatic QR-code tickets — no developer needed.",
  alternates: { canonical: "https://seatflow.app/en/blog/comedy-club-ticketing" },
  openGraph: {
    title: "Comedy Club Ticket Shop Setup: Live in One Hour",
    description: "Step by step: your own ticket shop for comedy clubs without a developer.",
    url: "https://seatflow.app/en/blog/comedy-club-ticketing",
    type: "article",
    publishedTime: "2026-05-08",
  },
};

const STEPS = [
  {
    num: "1",
    title: "Create an account",
    duration: "2 minutes",
    desc: "Name, e-mail, password — no credit card required. The Free plan is enough for testing.",
  },
  {
    num: "2",
    title: "Create venue and floor plan",
    duration: "20–30 minutes",
    desc: "Draw your seating layout using the visual editor: drag rows, add tables, adjust spacing. No technical knowledge needed.",
  },
  {
    num: "3",
    title: "Create an event",
    duration: "5 minutes",
    desc: "Title, date, description, price categories — all in one form. You can create recurring shows too.",
  },
  {
    num: "4",
    title: "Share the booking link",
    duration: "1 minute",
    desc: "The booking page is immediately available as a link — share it on Instagram, in your newsletter or embed it on your website.",
  },
];

export default function ArticleComedyClub() {
  return (
    <article>
      <Link href="/en/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All articles
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-05-08">8 May 2026</time>
          <span>·</span>
          <span>6 min read</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Comedy Club</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Comedy Club Ticket Shop Setup: Live in One Hour
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Whether it&apos;s a weekly stand-up night, an open mic or a special show: comedy clubs that still sell tickets at the door are leaving money on the table. Here&apos;s how to go digital in one hour — with numbered seats and automatic e-ticket delivery.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>Why comedy clubs benefit from online ticketing</h2>
        <p>
          The comedy club audience is young, mobile and accustomed to booking online. If your show isn&apos;t bookable via smartphone, you lose spontaneous guests — especially from social media. Beyond that, advance bookings give you reliable capacity planning: you know days in advance how many people are coming.
        </p>
        <p>
          Numbered seats add an extra advantage: guests can choose where they want to sit — front row for a more intense experience, back row for a quieter spot. This raises the perceived value of a ticket.
        </p>

        <h2>The setup in 4 steps</h2>
      </div>

      <div className="space-y-4 my-8">
        {STEPS.map((step) => (
          <div key={step.num} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
              {step.num}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{step.title}</p>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{step.duration}</span>
              </div>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">

        <h2>Checklist: before publishing the booking page</h2>
        <ul>
          <li>Complete at least one test booking yourself — including payment</li>
          <li>Check that the QR code ticket arrives in the inbox (and not in spam)</li>
          <li>Test the booking page on a smartphone</li>
          <li>Set up a Stripe account for payouts (takes 10 minutes)</li>
          <li>Prepare a short description text for the event page</li>
        </ul>

        <h2>Pricing: what&apos;s worth it?</h2>
        <p>
          For comedy clubs, the break-even point is usually around 40–60 tickets per month: from that volume, a Pro plan (with lower per-ticket fee) becomes more economical than the Free plan. For weekly shows with 50–80 guests, the calculation is clear.
        </p>
        <p>
          If you want to compare different ticketing systems before deciding,{" "}
          <Link href="/en/blog/ticketing-comparison" className="text-primary underline underline-offset-4 hover:text-primary/80">
            our comparison article
          </Link>{" "}
          shows the differences between common solutions.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Try it free — your show live in one hour</h3>
        <p className="text-sm text-muted-foreground mb-4">
          No credit card, no developer, no lock-in. The Free plan covers up to 3 events per month.
        </p>
        <Button asChild>
          <Link href="/register">Start free →</Link>
        </Button>
      </div>
    </article>
  );
}
