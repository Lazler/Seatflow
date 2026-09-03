import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  metadataBase: new URL("https://seatflow.app"),
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SeatFlow</span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-foreground transition-colors">AGB</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link href="/imprint" className="hover:text-foreground transition-colors">Impressum</Link>
          </div>
          <Link href="/register" className="text-primary font-medium hover:text-primary/80 transition-colors">
            Kostenlos starten →
          </Link>
        </div>
      </footer>
    </div>
  );
}
