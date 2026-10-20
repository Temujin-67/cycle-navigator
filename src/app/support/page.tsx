import { LegalShell, h2Style, pStyle } from "@/components/LegalShell";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <LegalShell title="Support">
      <p style={pStyle}>
        Need help with {APP_NAME}, have a question, or found a bug? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontWeight: 700 }}>{CONTACT_EMAIL}</a> with a short description and
        we&apos;ll get back to you.
      </p>

      <h2 style={h2Style}>Common questions</h2>

      <p style={pStyle}>
        <b>Is my data private?</b>
        <br />
        Yes. Everything you enter is stored on your phone only. See the Privacy Policy.
      </p>

      <p style={pStyle}>
        <b>Does the app give medical advice?</b>
        <br />
        No. It is a light-hearted guide based on general cycle patterns. It is not for medical decisions or contraception.
      </p>

      <p style={pStyle}>
        <b>The days look wrong. How do I fix them?</b>
        <br />
        Open Settings and tap &quot;Edit date &amp; cycle length&quot;. Check the first day of her last period and her
        typical cycle length. If her period has just started, tap &quot;Her period started today&quot;.
      </p>

      <p style={pStyle}>
        <b>I changed phone. Where did my data go?</b>
        <br />
        Data lives only on the phone where you entered it, so on a new phone you enter the date again.
      </p>
    </LegalShell>
  );
}
