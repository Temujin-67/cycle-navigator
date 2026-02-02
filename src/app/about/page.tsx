import Link from "next/link";

export default function AboutPage() {
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
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>About Cycle Forecast</h1>
        <Link href="/" style={{ fontSize: 13, fontWeight: 900 }}>Home</Link>
      </div>

      <p style={{ marginTop: "1rem", lineHeight: 1.5 }}>
        Her Mood Map is built on <b>general hormonal cycle patterns</b>. It helps men understand what phase she&apos;s in
        and how it affects her mood — so you get fewer arguments and a better relationship. No blame. Just practical
        awareness.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>How it works</h2>
      <ul style={{ lineHeight: 1.6, paddingLeft: "1.25rem" }}>
        <li><b>First day of her cycle</b> — The first day of her last period. Enter it so the app can count days and phases.</li>
        <li><b>Phases</b> — Menstrual, Follicular, Ovulatory, Luteal, and PMS. Each phase has typical patterns for mood, stress, and libido.</li>
        <li><b>Period over?</b> — If her period is still going past the default 5 days, tap &quot;No, still going&quot; so we keep that week as Menstrual phase.</li>
        <li><b>New period started?</b> — When you reach the end of a cycle (e.g. Day 28), the app asks if a new period has started. Say &quot;Yes, new cycle&quot; to reset to Day 1. We use that to learn her cycle length for next time.</li>
        <li><b>Pattern-based</b> — The app uses general patterns, not her personal data over time. Individual responses differ.</li>
      </ul>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>Disclaimer</h2>

      <p style={{ marginTop: "0.5rem", lineHeight: 1.5 }}>
        Individual responses vary. This tool does <b>not</b> predict behaviour or outcomes. It is <b>not medical
        advice</b>. Real life — communication, health, stress, personality — always overrides any pattern shown here.
      </p>

      <p style={{ marginTop: "0.75rem", lineHeight: 1.5 }}>
        The app is for <b>understanding</b>, not control. Don&apos;t use it to make assumptions or decisions without
        talking to your partner.
      </p>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/disclaimer" style={{ fontSize: 14, fontWeight: 700 }}>Full disclaimer &amp; terms of use →</Link>
      </p>
    </main>
  );
}
