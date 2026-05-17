"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, MapPin, LogOut, ReceiptText, Tag, Ticket, BarChart2, CreditCard } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function DashboardNavigation() {
  const pfad = usePathname();
  const router = useRouter();
  const t = useT();

  const NAVIGATION = [
    { href: "/dashboard",                  label: t.nav.uebersicht,       icon: LayoutDashboard, exakt: true  },
    { href: "/dashboard/buchungen",        label: t.nav.buchungen,        icon: ReceiptText,     exakt: false },
    { href: "/dashboard/events",           label: t.nav.events,           icon: Calendar,        exakt: false },
    { href: "/dashboard/analytics",        label: t.nav.analytics,        icon: BarChart2,       exakt: false },
    { href: "/dashboard/venues",           label: t.nav.venues,           icon: MapPin,          exakt: false },
    { href: "/dashboard/gutscheine",       label: t.nav.gutscheine,       icon: Tag,             exakt: false },
    { href: "/dashboard/ticket-templates", label: t.nav.ticketTemplates,  icon: Ticket,          exakt: false },
    { href: "/dashboard/abo",              label: t.nav.abo ?? "Abo",     icon: CreditCard,      exakt: true  },
  ];

  async function abmelden() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/anmelden");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">SF</span>
          </div>
          <span className="font-semibold">SeatFlow</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAVIGATION.map(({ href, label, icon: Icon, exakt }) => {
          const aktiv = exakt ? pfad === href : pfad.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                aktiv
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2 border-t border-border pt-3 space-y-1">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={abmelden}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t.nav.abmelden}
        </Button>
      </div>
    </aside>
  );
}
