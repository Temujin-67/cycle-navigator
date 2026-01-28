import Link from "next/link";

export default function DisclaimerPage() {
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
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Disclaimer &amp; Terms of Use</h1>
        <Link href="/" style={{ fontSize: 13, fontWeight: 900 }}>Home</Link>
      </div>

      <p style={{ marginTop: "1rem", lineHeight: 1.6, fontSize: "0.9375rem" }}>
        By using Cycle Forecast you agree to the following. If you do not agree, do not use the app.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>Not medical or clinical advice</h2>
      <p style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
        Cycle Forecast is <b>for informational and educational use only</b>. It is <b>not medical advice</b>, not clinical
        advice, and not a substitute for advice from a qualified healthcare provider. Do not use this app to make
        medical decisions, to diagnose, treat, or manage any health condition, or for contraception or family planning.
        Always consult a healthcare provider for health-related decisions.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>Not a predictor of behaviour or outcomes</h2>
      <p style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
        The app uses <b>general hormonal cycle patterns</b>. It does not predict how any individual will feel or behave.
        Individual responses vary. Real life — communication, health, stress, personality, and many other factors —
        overrides any pattern shown here. The app is for <b>understanding and awareness</b>, not control. Do not use it
        to make assumptions or decisions without talking to your partner.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>No guarantees; no liability</h2>
      <p style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
        Cycle Forecast is provided &quot;as is&quot; without warranties of any kind. We do not guarantee accuracy, completeness,
        or fitness for any purpose. To the fullest extent permitted by law, we exclude liability for any loss or damage
        arising from your use of the app.
      </p>

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.125rem", fontWeight: 700 }}>Privacy</h2>
      <p style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
        Data you enter (e.g. dates, cycle length) is stored locally on your device. We do not collect or transmit it to
        our servers. Use of the app is at your own risk.
      </p>

      <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Last updated: January 2025. We may update this page from time to time.
      </p>

      <p style={{ marginTop: "1rem" }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700 }}>← Back to Home</Link>
        {" · "}
        <Link href="/about" style={{ fontSize: 14, fontWeight: 700 }}>About</Link>
      </p>
    </main>
  );
}
