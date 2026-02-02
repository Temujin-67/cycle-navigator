// CHANGED LINES:
// - Renamed app from "Cycle Forecast" to "Her Mood Map" in metadata, OpenGraph, and Twitter

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://cycle-navigator.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Her Mood Map",
    template: "%s | Her Mood Map",
  },
  description:
    "Understand your partner’s cycle-related mood patterns. Better timing, fewer misunderstandings. Awareness, not prediction.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Her Mood Map",
    description:
      "Understand your partner’s cycle-related mood patterns. Better timing, fewer misunderstandings. Awareness, not prediction.",
    url: siteUrl,
    siteName: "Her Mood Map",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Her Mood Map",
    description:
      "Understand your partner’s cycle-related mood patterns. Better timing, fewer misunderstandings. Awareness, not prediction.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16A34A" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
