import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthHashRedirect } from "@/components/auth-hash-redirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SeatFlow – Ticketshop für kleine Venues",
  description:
    "Interaktiver Sitzplan-Ticketshop für Theater, Kabaretts und Comedy-Clubs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <AuthHashRedirect />
        {children}
      </body>
    </html>
  );
}
