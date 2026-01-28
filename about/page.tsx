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
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>About Cycle Forecast</h1>

      <p style={{ marginTop: "1rem", lineHeight: 1.5 }}>
        Cycle Forecast is built on <b>general hormonal cycle patterns</b>. It helps men understand what phase she&apos;s in
        and how it affects her mood — so you get fewer arguments and a better relationship. No blame. Just practical
        awareness.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>Disclaimer</h2>

      <p style={{ marginTop: "0.5rem", lineHeight: 1.5 }}>
        Individual responses vary. This tool does <b>not</b> predict behaviour or outcomes. It is <b>not medical
        advice</b>. Real life — communication, health, stress, personality — always overrides any pattern shown here.
      </p>

      <p style={{ marginTop: "0.75rem", lineHeight: 1.5 }}>
        The app is for <b>understanding</b>, not control. Don&apos;t use it to make assumptions or decisions without
        talking to your partner.
      </p>
    </main>
  );
}
