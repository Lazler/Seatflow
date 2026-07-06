import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthHashRedirect } from "@/components/auth-hash-redirect";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "SeatFlow – Ticketshop mit Sitzplan für kleine Venues",
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
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
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
