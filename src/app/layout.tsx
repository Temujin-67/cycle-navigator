// CHANGED LINES:
// - src/app/layout.tsx: metadata block — removed conflict markers and merged fields.
//   Kept: Cycle Forecast title/description (existing behaviour/copy)
//   Preserved: manifest + appleWebApp (from the other side), aligned titles to Cycle Forecast.

import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: "Cycle Forecast",
  description:
    "Know her cycle phase. Best and worst days for conversations, libido, pregnancy. Fewer arguments, better relationship.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cycle Forecast",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16A34A" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=document.documentElement.getAttribute("data-theme")||(typeof localStorage!=="undefined"&&localStorage.getItem("cf_theme"))||"";if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}else{var d=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light");}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
