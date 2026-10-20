import Link from "next/link";
import type { ReactNode } from "react";

// Shared frame for About, Privacy, Support and Terms so they look and behave the same.
export function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "1.5rem 1.25rem 3rem",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "var(--foreground)",
        fontSize: 17,
        lineHeight: 1.55,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: 12 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
        <Link href="/navigate" style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>
          ← Back
        </Link>
      </div>
      {children}
      <p style={{ marginTop: "2rem", fontSize: 15, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Link href="/about" style={{ fontWeight: 700 }}>About</Link>
        <Link href="/privacy" style={{ fontWeight: 700 }}>Privacy</Link>
        <Link href="/disclaimer" style={{ fontWeight: 700 }}>Terms</Link>
        <Link href="/support" style={{ fontWeight: 700 }}>Support</Link>
      </p>
    </main>
  );
}

export const h2Style = { marginTop: "1.5rem", marginBottom: 0, fontSize: "1.125rem", fontWeight: 800 } as const;
export const pStyle = { marginTop: "0.5rem", marginBottom: 0 } as const;
