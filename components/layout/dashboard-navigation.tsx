"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SquaresFour as LayoutDashboard, Calendar, MapPin, SignOut as LogOut, Receipt as ReceiptText, Tag, Ticket, ChartBar as BarChart2, CreditCard, List as Menu, X } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";

function initialen(name: string) {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return "?";
  if (teile.length === 1) return teile[0].slice(0, 2).toUpperCase();
  return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase();
}

export function DashboardNavigation({
  orgName,
  userEmail,
  planLabel,
}: {
  orgName?: string;
  userEmail?: string;
  planLabel?: string;
}) {
  const pfad = usePathname();
  const router = useRouter();
  const t = useT();
  const [drawerOffen, setDrawerOffen] = useState(false);

  const NAV_UEBERSICHT = [
    { href: "/dashboard",           label: t.nav.uebersicht, icon: LayoutDashboard, exakt: true  },
    { href: "/dashboard/bookings",  label: t.nav.buchungen,  icon: ReceiptText,     exakt: false },
    { href: "/dashboard/events",    label: t.nav.events,     icon: Calendar,        exakt: false },
    { href: "/dashboard/analytics", label: t.nav.analytics,  icon: BarChart2,       exakt: false },
  ];
  const NAV_VERWALTUNG = [
    { href: "/dashboard/venues",           label: t.nav.venues,          icon: MapPin,     exakt: false },
    { href: "/dashboard/vouchers",         label: t.nav.gutscheine,      icon: Tag,        exakt: false },
    { href: "/dashboard/ticket-templates", label: t.nav.ticketTemplates, icon: Ticket,     exakt: false },
    { href: "/dashboard/subscription",     label: t.nav.abo ?? "Abo",    icon: CreditCard, exakt: true  },
  ];
  const NAVIGATION = [...NAV_UEBERSICHT, ...NAV_VERWALTUNG];

  // Bottom tab bar shows the 4 most important items
  const TAB_ITEMS = NAV_UEBERSICHT;

  function istAktiv(href: string, exakt: boolean) {
    return exakt ? pfad === href : pfad.startsWith(href);
  }

  async function abmelden() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLink = (item: typeof NAVIGATION[number], onClick?: () => void) => {
    const aktiv = istAktiv(item.href, item.exakt);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        aria-current={aktiv ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          aktiv
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar (lg+) ─────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 border-r border-border bg-card h-screen sticky top-0 flex-col hidden lg:flex">
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Logo />
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.nav.uebersicht}</p>
          {NAV_UEBERSICHT.map((item) => navLink(item))}
          <p className="px-3 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.nav.verwaltung}</p>
          {NAV_VERWALTUNG.map((item) => navLink(item))}
        </nav>

        <div className="px-3 pb-1 border-t border-border pt-2">
          <LanguageSwitcher />
        </div>
        <div className="px-3 pb-3 pt-1 border-t border-border flex items-center gap-3">
          <span className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {initialen(orgName || "SeatFlow")}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{orgName || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {planLabel ? `${planLabel} · ` : ""}{userEmail ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={abmelden}
            aria-label={t.nav.abmelden}
            className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header (< lg) ─────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur border-b border-border z-30 flex items-center px-4 gap-3">
        <button
          onClick={() => setDrawerOffen(true)}
          className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t.nav.menueOeffnen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
      </header>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <Dialog.Root open={drawerOffen} onOpenChange={setDrawerOffen}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay fixed inset-0 bg-black/40 z-40 lg:hidden" />
          <Dialog.Content
            className="drawer-content fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col lg:hidden focus:outline-none"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">{t.nav.navigation}</Dialog.Title>

            {/* Drawer header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
              <Logo />
              <button
                onClick={() => setDrawerOffen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={t.nav.menueSchliessen}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.nav.uebersicht}</p>
              {NAV_UEBERSICHT.map((item) => navLink(item, () => setDrawerOffen(false)))}
              <p className="px-3 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.nav.verwaltung}</p>
              {NAV_VERWALTUNG.map((item) => navLink(item, () => setDrawerOffen(false)))}
            </nav>

            {/* Drawer footer */}
            <div className="shrink-0">
              <div className="px-3 pb-1 border-t border-border pt-2">
                <LanguageSwitcher />
              </div>
              <div className="px-3 pb-6 pt-1 border-t border-border flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {initialen(orgName || "SeatFlow")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{orgName || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {planLabel ? `${planLabel} · ` : ""}{userEmail ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={abmelden}
                  aria-label={t.nav.abmelden}
                  className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Mobile Bottom Tab Bar (< lg) ─────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-area-inset-bottom">
        <div className="flex items-stretch h-16">
          {TAB_ITEMS.map((item) => {
            const aktiv = istAktiv(item.href, item.exakt);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={aktiv ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  aktiv ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", aktiv && "scale-110")} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {/* "Mehr" button */}
          <button
            onClick={() => setDrawerOffen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
            <span>{t.nav.mehr}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
