"use client";

import { Suspense, useMemo } from "react";
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

function riskFor(phase: Phase): { risk: RiskLevel; riskNote: string } {
  if (phase === "PMS") return { risk: "High sensitivity", riskNote: "Small stuff can blow up faster." };
  if (phase === "Menstrual") return { risk: "Be mindful", riskNote: "Lower energy + lower patience is common." };
  if (phase === "Luteal") return { risk: "Be mindful", riskNote: "More variability possible." };
  return { risk: "Low friction", riskNote: "Often smoother days." };
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
  return Math.round(DEFAULTS.cycleLength / 2); // 14
}

function phaseMeta(phase: Phase) {
  const meta: Record<
    Phase,
    { emoji: string; bg: string; border: string; pillBg: string; pillFg: string }
  > = {
    Menstrual: { emoji: "🩸", bg: "linear-gradient(180deg, #FFF3F7 0%, #FFFFFF 100%)", border: "#FF4D7D", pillBg: "#FFE0EA", pillFg: "#9B1035" },
    Follicular: { emoji: "🌱", bg: "linear-gradient(180deg, #F1FFF5 0%, #FFFFFF 100%)", border: "#19C37D", pillBg: "#DFFBEA", pillFg: "#0B6B45" },
    Ovulatory: { emoji: "🔥", bg: "linear-gradient(180deg, #FFF7E6 0%, #FFFFFF 100%)", border: "#FFB020", pillBg: "#FFEBC2", pillFg: "#7A4B00" },
    Luteal: { emoji: "🧠", bg: "linear-gradient(180deg, #EEF7FF 0%, #FFFFFF 100%)", border: "#1E88E5", pillBg: "#D8ECFF", pillFg: "#0B4A84" },
    PMS: { emoji: "⚡", bg: "linear-gradient(180deg, #FFEFF1 0%, #FFFFFF 100%)", border: "#FF3B30", pillBg: "#FFD6D3", pillFg: "#7F1D1D" },
  };
  return meta[phase];
}

function riskBadge(risk: RiskLevel) {
  if (risk === "Low friction") return { label: "GREEN", bg: "#E8FFF1", fg: "#0B6B45", border: "#19C37D", emoji: "🟢" };
  if (risk === "Be mindful") return { label: "AMBER", bg: "#FFF6E5", fg: "#7A4B00", border: "#FFB020", emoji: "🟠" };
  return { label: "RED", bg: "#FFECEC", fg: "#7F1D1D", border: "#FF3B30", emoji: "🔴" };
}

function copy(phase: Phase, age: number, dayIndex: number) {
  const t = ageTone(age);

  if (phase === "Menstrual")
    return {
      mood: `Softer day for many. Variability: ${t.variability}.`,
      libido: "Usually lower; comfort-style closeness fits better.",
      energy: "Energy often lower.",
      stress: `Smaller buffer is common. Sensitivity: ${t.sensitivity}.`,
      communication: "Keep it short, calm, and non-pushy.",
      partnerFocus: "Low pressure, low drama.",
      helps: "Practical help + steady tone.",
      avoid: "Surprise debates, pushing decisions.",
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
      mood: `More open day for many. Variability: ${t.variability}.`,
      libido: peak ? pick(libidoPeak, dayIndex, 2) : pick(libidoNormal, dayIndex, 2),
      energy: "More drive is common.",
      stress: "Often more resilient today.",
      communication: "Light + direct works best. Don’t overtalk it.",
      partnerFocus: "Easy day to reconnect.",
      helps: "Be present. Keep it natural.",
      avoid: "Pushing, assumptions, making it heavy.",
    };
  }

  if (phase === "Luteal")
    return {
      mood: `More variable day-to-day. Variability: ${t.variability}.`,
      libido: "Often moderate then trending down.",
      energy: "Steady but not peak.",
      stress: `Sensitivity can rise. Sensitivity: ${t.sensitivity}.`,
      communication: "Clear and specific beats long talks.",
      partnerFocus: "Predictability wins.",
      helps: "Plan early, keep it simple.",
      avoid: "Last-minute changes, vague requests.",
    };

  if (phase === "PMS")
    return {
      mood: `Higher sensitivity window for many. Variability: ${t.variability}.`,
      libido: "Often lower or inconsistent.",
      energy: "Energy often lower.",
      stress: `Reactivity can be higher. Sensitivity: ${t.sensitivity}.`,
      communication: "Don’t debate. De-escalate early.",
      partnerFocus: "Keep the day smaller, not bigger.",
      helps: "Low pressure + steady tone.",
      avoid: "Criticism, pushing decisions, sarcasm.",
    };

  return {
    mood: `Often steadier days. Variability: ${t.variability}.`,
    libido: "Often rising gradually.",
    energy: "Energy usually improving.",
    stress: "Often better buffer today.",
    communication: "Good day for practical chats.",
    partnerFocus: "Plans and progress.",
    helps: "Clear plan + follow-through.",
    avoid: "Unnecessary tension.",
  };
}

function NavigateInner() {
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

  const safeOffset = offset < 0 ? 0 : offset;
  const todayInfo = build(safeOffset);
  const tomorrowInfo = build(safeOffset + 1);

  return (
    <main style={{ maxWidth: 900, margin: "28px auto", padding: 18, fontFamily: "system-ui", color: "#111" }}>
      <h1 style={{ marginTop: 0, marginBottom: 6, fontSize: 28, letterSpacing: -0.2 }}>Day View 🧭</h1>

      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.45 }}>
        Built on hormonal cycle patterns (education-only). Individual responses may differ. Real life always overrides predictions.
      </div>

      {[{ label: "TODAY", d: todayInfo }, { label: "TOMORROW", d: tomorrowInfo }].map(({ label, d }) => {
        const meta = phaseMeta(d.phase);
        const rb = riskBadge(d.risk);

        return (
          <section
            key={label}
            style={{
              borderRadius: 18,
              padding: 16,
              background: meta.bg,
              marginTop: 14,
              border: "1px solid #eee",
              boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, background: meta.border }} />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <strong style={{ fontSize: 13, letterSpacing: 0.4, paddingLeft: 8 }}>{label}</strong>
              <span style={{ color: "#666", fontSize: 13 }}>{fmt(d.date)}</span>
            </div>

            <div style={{ marginTop: 10, paddingLeft: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: meta.pillBg,
                  color: meta.pillFg,
                  fontSize: 12,
                  fontWeight: 800,
                  border: `1px solid ${meta.border}`,
                }}
              >
                <span aria-hidden="true">{meta.emoji}</span>
                <span>
                  Day {d.dayIndex} — {d.phase}
                </span>
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: rb.bg,
                  color: rb.fg,
                  fontSize: 12,
                  fontWeight: 800,
                  border: `1px solid ${rb.border}`,
                }}
                title={d.riskNote}
              >
                <span aria-hidden="true">{rb.emoji}</span>
                <span>{rb.label}</span>
                <span style={{ fontWeight: 700, opacity: 0.9 }}>Risk: {d.risk}</span>
              </span>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.35, paddingLeft: 8 }}>
              <div>
                <b>🙂 Mood:</b> {d.mood}
              </div>
              <div>
                <b>🔥 Libido:</b> {d.libido}
              </div>
              <div>
                <b>⚡ Energy:</b> {d.energy}
              </div>
              <div>
                <b>🧯 Stress response:</b> {d.stress}
              </div>
              <div>
                <b>💬 Communication:</b> {d.communication}
              </div>
              <div>
                <b>🎯 Partner focus:</b> {d.partnerFocus}
              </div>
              <div>
                <b>✅ What helps:</b> {d.helps}
              </div>
              <div>
                <b>🚫 What to avoid:</b> {d.avoid}
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}

export default function Page() {
  // ✅ Required by Next.js: useSearchParams must be inside a Suspense boundary.
  return (
    <Suspense fallback={<div style={{ maxWidth: 900, margin: "28px auto", padding: 18, fontFamily: "system-ui" }}>Loading…</div>}>
      <NavigateInner />
    </Suspense>
  );
}
