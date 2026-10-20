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
    default: "Eggshells",
    template: "%s | Eggshells",
  },
  description:
    "Eggshells: know where to step. A tongue-in-cheek day-by-day guide to her cycle, for men. A guide, not a verdict.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Eggshells",
    description:
      "Eggshells: know where to step. A tongue-in-cheek day-by-day guide to her cycle, for men. A guide, not a verdict.",
    url: siteUrl,
    siteName: "Eggshells",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Eggshells",
    description:
      "Eggshells: know where to step. A tongue-in-cheek day-by-day guide to her cycle, for men. A guide, not a verdict.",
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
