import { LegalShell, h2Style, pStyle } from "@/components/LegalShell";
import { APP_NAME, LEGAL_UPDATED } from "@/lib/site";

export const metadata = { title: "Terms & Disclaimer" };

export default function DisclaimerPage() {
  return (
    <LegalShell title="Terms & Disclaimer">
      <p style={{ ...pStyle, color: "var(--text-secondary)" }}>Last updated: {LEGAL_UPDATED}</p>
      <p style={pStyle}>By using {APP_NAME} you agree to the following. If you do not agree, please do not use the app.</p>

      <h2 style={h2Style}>Not medical advice</h2>
      <p style={pStyle}>
        {APP_NAME} is <b>for information and entertainment only</b>. It is not medical advice and not a substitute for a
        qualified healthcare provider. Do not use it to diagnose, treat or manage any condition, or for contraception or
        family planning.
      </p>

      <h2 style={h2Style}>A guide, not a verdict</h2>
      <p style={pStyle}>
        The app uses <b>general cycle patterns</b>. It does not know how any individual feels and does not predict
        behaviour. People vary, and communication, health, stress and personality all matter more than a calendar. Talk to
        your partner and ask her instead of assuming.
      </p>

      <h2 style={h2Style}>Respect</h2>
      <p style={pStyle}>
        Only enter information about someone who is comfortable with you doing so. Do not use the app to pressure,
        control or make decisions for another person.
      </p>

      <h2 style={h2Style}>No guarantees, no liability</h2>
      <p style={pStyle}>
        The app is provided &quot;as is&quot; without warranties of any kind. We do not guarantee accuracy or fitness for any
        purpose. To the fullest extent permitted by law, we are not liable for any loss or damage arising from your use of
        the app.
      </p>

      <h2 style={h2Style}>Privacy</h2>
      <p style={pStyle}>
        What you enter stays on your phone. See the Privacy Policy for details.
      </p>

      <p style={{ marginTop: "1.5rem", fontSize: 15, color: "var(--text-secondary)" }}>
        We may update this page from time to time.
      </p>
    </LegalShell>
  );
}
