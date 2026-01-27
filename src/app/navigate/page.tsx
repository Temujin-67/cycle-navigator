"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";
type RiskLevel = "Low friction" | "Be mindful" | "High sensitivity";

type DayInfo = {
  date: Date;
  dayIndex: number;
  phase: Phase;
  risk: RiskLevel;
  riskNote: string;
  mood: string;
  libido: string;
  energy: string;
  stress: string;
  communication: string;
  partnerFocus: string;
  helps: string;
  avoid: string;
};

const DEFAULTS = {
  cycleLength: 28,
  bleedDays: 5,
  pmsDays: 5,
  ovulationWindow: 3,
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(12, 0, 0, 0);
  return x;
}

// DD MM YYYY
function fmt(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function ageTone(age: number) {
  const a = clamp(age, 18, 55);
  if (a <= 30) return { variability: "moderate", sensitivity: "moderate" };
  if (a <= 40) return { variability: "moderate to higher", sensitivity: "moderate to higher" };
  return { variability: "higher", sensitivity: "higher" };
}

function phaseForDay(dayIndex: number): Phase {
  const { cycleLength, bleedDays, pmsDays, ovulationWindow } = DEFAULTS;
  const ovCenter = Math.round(cycleLength / 2);
  const ovHalf = Math.floor(ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;
  const pmsStart = cycleLength - pmsDays + 1;

  if (dayIndex <= bleedDays) return "Menstrual";
  if (dayIndex >= ovStart && dayIndex <= ovEnd) return "Ovulatory";
  if (dayIndex >= pmsStart) return "PMS";
  if (dayIndex > ovEnd && dayIndex < pmsStart) return "Luteal";
  return "Follicular";
}

// ✅ typed RiskLevel literals
function riskFor(phase: Phase): { risk: RiskLevel; riskNote: string } {
  if (phase === "PMS") return { risk: "High sensitivity", riskNote: "Emotions may spike faster." };
  if (phase === "Menstrual") return { risk: "Be mindful", riskNote: "Lower energy and tolerance." };
  if (phase === "Luteal") return { risk: "Be mindful", riskNote: "More variability possible." };
  return { risk: "Low friction", riskNote: "Generally easier interaction window." };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pick(lines: string[], dayIndex: number, salt: number) {
  const idx = (dayIndex * 3 + salt) % lines.length;
  return lines[idx];
}

function ovulationPeakDayIndex() {
  // default cycle assumption (28 days) → peak day ~14
  return Math.round(DEFAULTS.cycleLength / 2);
}

function copy(phase: Phase, age: number, dayIndex: number) {
  const t = ageTone(age);

  if (phase === "Menstrual")
    return {
      mood: `More inward, comfort-seeking. Variability is ${t.variability}.`,
      libido: "Often lower; closeness can be more comfort-focused.",
      energy: "Lower energy is common.",
      stress: `Lower tolerance is common. Sensitivity is ${t.sensitivity}.`,
      communication: "Gentle tone; keep questions simple; no pressure.",
      partnerFocus: "Support and comfort first.",
      helps: "Warmth, reassurance, practical help.",
      avoid: "Pushing decisions, surprise debates.",
    };

  if (phase === "Ovulatory") {
    const peak = dayIndex === ovulationPeakDayIndex();

    const libidoNormal = [
      "Interest tends to be higher than average.",
      "Signals are clearer today.",
      "Less guesswork than usual.",
      "Receptivity is generally better.",
      "Flirting is less risky today.",
      "Affection is more likely to be welcomed.",
      "Momentum builds easier.",
      "If it’s a no, it’s still a no — but you’re less likely to misread.",
    ];

    const libidoPeak = [
      "Interest is usually at its highest today.",
      "Signals are harder to miss.",
      "Less ambiguity than usual.",
      "Responses come faster.",
      "If there’s attraction, it shows more clearly today.",
      "Affection is more likely to be returned.",
      "Momentum builds easier.",
      "If it’s a no, it’s still a no — but you’re less likely to misread.",
    ];

    return {
      mood: `Often more open and expressive. Variability is ${t.variability}.`,
      libido: peak ? pick(libidoPeak, dayIndex, 2) : pick(libidoNormal, dayIndex, 2),
      energy: "Higher drive is more likely.",
      stress: "Tolerance is often stronger.",
      communication: "Clear, warm, direct. Don’t overtalk it.",
      partnerFocus: "This is usually an easier day to reconnect.",
      helps: "Be present. Keep it natural.",
      avoid: "Pushing, assumptions, making it heavy.",
    };
  }

  if (phase === "Luteal")
    return {
      mood: `More serious or reflective. Variability is ${t.variability}.`,
      libido: "Often moderate then trending down.",
      energy: "Steady but not peak.",
      stress: `Sensitivity can rise gradually. Sensitivity is ${t.sensitivity}.`,
      communication: "Be clear; keep requests specific.",
      partnerFocus: "Predictability and calm.",
      helps: "Routine, clarity, reassurance.",
      avoid: "Last-minute changes, vague expectations.",
    };

  if (phase === "PMS")
    return {
      mood: `More sensitive day-to-day. Variability is ${t.variability}.`,
      libido: "Often lower or inconsistent.",
      energy: "Lower energy is common.",
      stress: `Reactivity can be higher. Sensitivity is ${t.sensitivity}.`,
      communication: "Keep it calm; don’t turn it into a debate.",
      partnerFocus: "Make the day simpler, not bigger.",
      helps: "Low pressure, steady tone.",
      avoid: "Debates, criticism, pushing decisions.",
    };

  // Follicular
  return {
    mood: `Often stable and clear. Variability is ${t.variability}.`,
    libido: "Often rising gradually.",
    energy: "Energy usually improving.",
    stress: "Resilience is often better.",
    communication: "Collaborative and direct.",
    partnerFocus: "Good day for plans and normal conversations.",
    helps: "Clear plans, follow-through.",
    avoid: "Unnecessary tension.",
  };
}

export default function NavigateClient() {
  const sp = useSearchParams();
  const age = Number(sp.get("age") || 0);
  const day1Str = sp.get("day1") || "";

  const day1 = useMemo(() => new Date(day1Str + "T12:00:00"), [day1Str]);
  const today = useMemo(() => new Date(), []);

  const offset = useMemo(() => {
    const a = startOfDay(today).getTime();
    const b = startOfDay(day1).getTime();
    return Math.floor((a - b) / 86400000);
  }, [today, day1]);

  const build = (o: number): DayInfo => {
    const date = addDays(day1, o);
    const dayIndex = (o % DEFAULTS.cycleLength) + 1;
    const phase = phaseForDay(dayIndex);
    const risk = riskFor(phase);
    const c = copy(phase, age, dayIndex);
    return { date, dayIndex, phase, ...risk, ...c };
  };

  const todayInfo = build(offset < 0 ? 0 : offset);
  const tomorrowInfo = build((offset < 0 ? 0 : offset) + 1);

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Day View</h1>

      <div style={{ fontSize: 13, color: "#444", marginBottom: 14 }}>
        Built on hormonal cycle patterns. Individual responses may differ. Real life always overrides predictions.
      </div>

      {[{ label: "TODAY", d: todayInfo }, { label: "TOMORROW", d: tomorrowInfo }].map(({ label, d }) => (
        <section
          key={label}
          style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 14, background: "#fff", marginTop: 14 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong>{label}</strong>
            <span style={{ color: "#666", fontSize: 13 }}>{fmt(d.date)}</span>
          </div>

          <div style={{ marginTop: 10, fontWeight: 700 }}>
            Day {d.dayIndex} — {d.phase}
          </div>

          <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
            <b>Relationship risk:</b> {d.risk}. {d.riskNote}
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.35 }}>
            <div>
              <b>Mood:</b> {d.mood}
            </div>
            <div>
              <b>Libido:</b> {d.libido}
            </div>
            <div>
              <b>Energy:</b> {d.energy}
            </div>
            <div>
              <b>Stress response:</b> {d.stress}
            </div>
            <div>
              <b>Communication:</b> {d.communication}
            </div>
            <div>
              <b>Partner focus:</b> {d.partnerFocus}
            </div>
            <div>
              <b>What helps:</b> {d.helps}
            </div>
            <div>
              <b>What to avoid:</b> {d.avoid}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
