import Link from "next/link";

export default function SupportPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "1.5rem 1.25rem",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "var(--foreground)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Support</h1>
        <Link href="/" style={{ fontSize: 13, fontWeight: 900 }}>Home</Link>
      </div>

      <p style={{ marginTop: "1rem", lineHeight: 1.5 }}>
        Need help with Her Mood Map, have a question, or found a bug? We&apos;re happy to help.
      </p>

      <p style={{ marginTop: "0.75rem", lineHeight: 1.5 }}>
        Email us at{" "}
        <a href="mailto:hermoodmap@gmail.com" style={{ fontWeight: 700 }}>
          hermoodmap@gmail.com
        </a>{" "}
        and we&apos;ll get back to you as soon as we can.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>Frequently Asked Questions</h2>

      <p style={{ marginTop: "0.75rem", lineHeight: 1.5 }}>
        <b>Is my data private?</b><br />
        Yes — Her Mood Map stores your data on your own device. See our Disclaimer &amp; Terms page for details.
      </p>

      <p style={{ marginTop: "0.75rem", lineHeight: 1.5 }}>
        <b>Does the app give medical advice?</b><br />
        No. Her Mood Map is an educational, awareness-focused tool and does not provide medical advice, predictions, or diagnostics.
      </p>

      <p style={{ marginTop: "0.75rem", lineHeight: 1.5 }}>
        <b>How do I report a bug or request a feature?</b><br />
        Email us at hermoodmap@gmail.com with a short description, and we&apos;ll take a look.
      </p>

      <p style={{ marginTop: "1rem" }}>
        <Link href="/disclaimer" style={{ fontSize: 14, fontWeight: 700 }}>Full disclaimer &amp; terms of use →</Link>
      </p>
    </main>
  );
}
