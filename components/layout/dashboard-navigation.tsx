"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SquaresFour as LayoutDashboard, Calendar, MapPin, SignOut as LogOut, Receipt as ReceiptText, Tag, Ticket, ChartBar as BarChart2, CreditCard, List as Menu, X } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

function LogoMark() {
  return (
    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z" />
        <line x1="9" y1="8" x2="9" y2="16" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

export function DashboardNavigation() {
  const pfad = usePathname();
  const router = useRouter();
  const t = useT();
  const [drawerOffen, setDrawerOffen] = useState(false);

  const NAVIGATION = [
    { href: "/dashboard",                  label: t.nav.uebersicht,       icon: LayoutDashboard, exakt: true  },
    { href: "/dashboard/bookings",        label: t.nav.buchungen,        icon: ReceiptText,     exakt: false },
    { href: "/dashboard/events",           label: t.nav.events,           icon: Calendar,        exakt: false },
    { href: "/dashboard/analytics",        label: t.nav.analytics,        icon: BarChart2,       exakt: false },
    { href: "/dashboard/venues",           label: t.nav.venues,           icon: MapPin,          exakt: false },
    { href: "/dashboard/vouchers",       label: t.nav.gutscheine,       icon: Tag,             exakt: false },
    { href: "/dashboard/ticket-templates", label: t.nav.ticketTemplates,  icon: Ticket,          exakt: false },
    { href: "/dashboard/subscription",              label: t.nav.abo ?? "Abo",     icon: CreditCard,      exakt: true  },
  ];

  // Bottom tab bar shows the 5 most important items
  const TAB_ITEMS = NAVIGATION.slice(0, 4);

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
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-semibold">SeatFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAVIGATION.map((item) => navLink(item))}
        </nav>

        <div className="px-3 pb-2 border-t border-border pt-3 space-y-1">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={abmelden}>
            <LogOut className="h-4 w-4 mr-3" />
            {t.nav.abmelden}
          </Button>
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
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-semibold text-sm">SeatFlow</span>
        </div>
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
              <div className="flex items-center gap-2">
                <LogoMark />
                <span className="font-semibold">SeatFlow</span>
              </div>
              <button
                onClick={() => setDrawerOffen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={t.nav.menueSchliessen}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAVIGATION.map((item) => navLink(item, () => setDrawerOffen(false)))}
            </nav>

            {/* Drawer footer */}
            <div className="px-3 pb-6 border-t border-border pt-3 space-y-1 shrink-0">
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={abmelden}>
                <LogOut className="h-4 w-4 mr-3" />
                {t.nav.abmelden}
              </Button>
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
