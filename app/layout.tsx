import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AuthHashRedirect } from "@/components/auth-hash-redirect";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "SeatFlow: Ticketshop mit Sitzplan für kleine Venues",
    template: "%s | SeatFlow",
  },
  description:
    "Interaktiver Sitzplan-Ticketshop für Theater, Kabaretts und Comedy-Clubs. Keine Provision, kein Entwickler.",
  metadataBase: new URL("https://seatflow.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${ibmPlexMono.variable} ${outfit.variable} antialiased`}>
      <head>
        <link rel="alternate" hrefLang="de" href="https://seatflow.app/" />
        <link rel="alternate" hrefLang="en" href="https://seatflow.app/en" />
        <link rel="alternate" hrefLang="hu" href="https://seatflow.app/hu" />
        <link rel="alternate" hrefLang="x-default" href="https://seatflow.app/" />
      </head>
      <body>
        <AuthHashRedirect />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
