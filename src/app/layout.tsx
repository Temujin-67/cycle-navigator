import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
    default: "Cycle Forecast",
    template: "%s | Cycle Forecast",
  },
  description:
    "Know her cycle phase. Best and worst days for conversations, libido, pregnancy. Fewer arguments, better relationship.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Cycle Forecast",
    description:
      "Know her cycle phase. Best and worst days for conversations, libido, pregnancy. Fewer arguments, better relationship.",
    url: siteUrl,
    siteName: "Cycle Forecast",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cycle Forecast",
    description:
      "Know her cycle phase. Best and worst days for conversations, libido, pregnancy. Fewer arguments, better relationship.",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16A34A" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
