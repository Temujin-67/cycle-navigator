import { LegalShell, h2Style, pStyle } from "@/components/LegalShell";
import { APP_NAME, PUBLISHER } from "@/lib/site";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <LegalShell title={`About ${APP_NAME}`}>
      <p style={pStyle}>
        {APP_NAME} is a tongue-in-cheek guide for men. It uses <b>general cycle patterns</b> to give you a day-by-day
        heads-up on what kind of day she may be having, so you can pick your moments. A guide, not a verdict: people
        vary, and real life always wins.
      </p>

      <h2 style={h2Style}>How it works</h2>
      <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
        <li><b>First day of her last period.</b> Enter it once and the app counts the days and works out the phase. It remembers it on this phone.</li>
        <li><b>Her typical cycle length.</b> Between 21 and 35 days. The default is 28.</li>
        <li><b>Phases.</b> Menstrual, Follicular, Ovulatory, Luteal and PMS. Each day shows a short line for mood, libido, stress, communication, what to do and what to avoid.</li>
        <li><b>Still on?</b> If her period runs past the days you entered, tap &quot;Still going&quot; and the app keeps those days as Menstrual.</li>
        <li><b>New period?</b> At the end of a cycle the app asks whether a new one has started. Tap &quot;Yeah, new cycle&quot; to go back to Day 1. The app remembers how long each cycle was and adjusts to her average over time.</li>
      </ul>

      <h2 style={h2Style}>Not a substitute for talking to her</h2>
      <p style={pStyle}>
        The app does not know how she actually feels. It is not medical advice, it is not for contraception or family
        planning, and it does not predict behaviour. Ask her. Read the room.
      </p>

      <h2 style={h2Style}>Your data</h2>
      <p style={pStyle}>
        Everything you enter stays on this phone. There are no accounts and nothing is sent anywhere.
      </p>

      <p style={{ marginTop: "1.5rem", fontSize: 15, color: "var(--text-secondary)" }}>A {PUBLISHER} project.</p>
    </LegalShell>
  );
}
