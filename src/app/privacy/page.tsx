import { LegalShell, h2Style, pStyle } from "@/components/LegalShell";
import { APP_NAME, CONTACT_EMAIL, LEGAL_UPDATED, PUBLISHER } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p style={{ ...pStyle, color: "var(--text-secondary)" }}>Last updated: {LEGAL_UPDATED}</p>
      <p style={pStyle}>
        {APP_NAME} (&quot;the app&quot;) is published by {PUBLISHER}. The short version: the app keeps what you enter on
        your phone and does not send it to us or to anyone else.
      </p>

      <h2 style={h2Style}>1. What the app stores on your phone</h2>
      <p style={pStyle}>
        The first day of her last period, her typical cycle length, her period length, the lengths of past cycles (used
        to work out an average), your display theme, and whether you have finished the intro. This is saved in the
        app&apos;s own storage on your device so you do not have to enter it again.
      </p>

      <h2 style={h2Style}>2. What we collect</h2>
      <p style={pStyle}>
        Nothing. We do not have accounts, servers that receive your data, analytics, advertising or tracking, and the
        app does not use third-party services that collect data. We cannot see what you enter.
      </p>

      <h2 style={h2Style}>3. Deleting your data</h2>
      <p style={pStyle}>
        Uninstalling the app removes everything it stored. Because nothing is sent to us, there is nothing on our side to
        delete.
      </p>

      <h2 style={h2Style}>4. Health information</h2>
      <p style={pStyle}>
        The dates you enter relate to another person&apos;s menstrual cycle. Please only enter information about someone
        who is comfortable with you doing so. The app is not a medical device and does not give medical advice. See the
        Terms &amp; Disclaimer.
      </p>

      <h2 style={h2Style}>5. Age</h2>
      <p style={pStyle}>
        The app is for adults. It is not designed for children and we do not knowingly collect data from anyone.
      </p>

      <h2 style={h2Style}>6. Changes</h2>
      <p style={pStyle}>If the app changes in a way that affects your privacy, we will update this page and the date above.</p>

      <h2 style={h2Style}>7. Contact</h2>
      <p style={pStyle}>
        Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontWeight: 700 }}>{CONTACT_EMAIL}</a>
      </p>
    </LegalShell>
  );
}
