"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ================= TYPES ================= */

type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";
type RiskLevel = "Low" | "Medium" | "High";

type DayInfo = {
  date: Date;
  dayIndex: number;
  phase: Phase;
  risk: RiskLevel;
  mood: string;
  libido: string;
  energy: string;
  stress: string;
  communication: string;
  focus: string;
  helps: string;
  avoid: string;
};

/* ================= CONSTANTS ================= */

const DEFAULTS = {
  cycleLength: 28,
  bleedDays: 7, // theoretical
  pmsDays: 5,
  ovulationWindow: 3,
};

/* ================= HELPERS ================= */

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(12, 0, 0, 0);
  return x;
}

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pick(lines: string[], dayIndex: number, salt: number) {
  return lines[(dayIndex * 7 + salt) % lines.length];
}

/* ================= PHASE LOGIC ================= */

function phaseForDay(dayIndex: number, bleedOverride?: number): Phase {
  const bleed = bleedOverride ?? DEFAULTS.bleedDays;

  const ovCenter = Math.round(DEFAULTS.cycleLength / 2);
  const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;
  const pmsStart = DEFAULTS.cycleLength - DEFAULTS.pmsDays + 1;

  if (dayIndex <= bleed) return "Menstrual";
  if (dayIndex >= ovStart && dayIndex <= ovEnd) return "Ovulatory";
  if (dayIndex >= pmsStart) return "PMS";
  if (dayIndex > ovEnd && dayIndex < pmsStart) return "Luteal";
  return "Follicular";
}

/* ================= COPY ================= */

function copyFor(phase: Phase, dayIndex: number): Omit<DayInfo, "date" | "dayIndex" | "phase"> {
  const base = {
    Menstrual: {
      risk: "High" as RiskLevel,
      mood: [
        "Tolerance is lower than usual today.",
        "Small things are more likely to irritate.",
        "Patience is limited today.",
      ],
      libido: [
        "Interest is basically off today.",
        "Physical interest is very low.",
        "This is not a sexual day.",
      ],
      energy: [
        "Energy is low and runs out quickly.",
        "Energy is limited today.",
        "Fatigue shows up faster than usual.",
      ],
      stress: [
        "Reaction time is short.",
        "Stress builds quickly.",
        "Little patience for friction.",
      ],
      communication: [
        "Talk less if you don’t want an argument.",
        "Keep conversations short and factual.",
        "This is not a discussion-heavy day.",
      ],
      focus: [
        "Do not escalate situations.",
        "Avoid pushing anything forward.",
        "Maintain stability, nothing more.",
      ],
      helps: [
        "Stick to essentials. Everything else can wait.",
        "Handle basics and move on.",
        "Keep the day simple and contained.",
      ],
      avoid: [
        "Opening issues you can’t finish today.",
        "Pushing for decisions or explanations.",
        "Turning minor things into topics.",
      ],
    },

    Ovulatory: {
      risk: "Low" as RiskLevel,
      mood: [
        "Reactions are faster and more open.",
        "Engagement is noticeably higher today.",
        "There’s more responsiveness today.",
      ],
      libido: [
        "Interest is clearly higher today.",
        "Signals are easier to read today.",
        "Attraction shows up more directly.",
      ],
      energy: [
        "Energy is higher and more social.",
        "More drive for interaction today.",
        "This is a higher-output day.",
      ],
      stress: [
        "Higher tolerance than usual.",
        "Less defensive reactions.",
        "Friction is less likely today.",
      ],
      communication: [
        "Tone matters more than wording.",
        "Simple confidence works best.",
        "Don’t overtalk.",
      ],
      focus: [
        "Connection is easier today.",
        "Momentum comes more naturally.",
        "Engagement pays off.",
      ],
      helps: [
        "Be present and direct.",
        "Act normally — no strategies.",
        "Let things flow.",
      ],
      avoid: [
        "Overplaying your hand.",
        "Forcing escalation.",
        "Reading too much into signals.",
      ],
    },

    Follicular: {
      risk: "Low" as RiskLevel,
      mood: [
        "Emotional baseline is steadier.",
        "More even reactions today.",
        "Less emotional drag.",
      ],
      libido: [
        "Interest is gradually returning.",
        "Physical interest starts picking up.",
        "More openness than last week.",
      ],
      energy: [
        "Energy is coming back online.",
        "More capacity to handle things.",
        "Drive is improving.",
      ],
      stress: [
        "Better buffer than before.",
        "Stress is easier to manage.",
        "More tolerance overall.",
      ],
      communication: [
        "Straightforward conversations work.",
        "Good day to speak plainly.",
        "Less risk of misunderstanding.",
      ],
      focus: [
        "Normal life runs smoother.",
        "Good time to reset rhythm.",
        "Planning is easier.",
      ],
      helps: [
        "Say what you mean and do it.",
        "Keep things clear and simple.",
        "Follow through.",
      ],
      avoid: [
        "Overanalyzing.",
        "Creating unnecessary tension.",
        "Digging into old issues.",
      ],
    },

    Luteal: {
      risk: "Medium" as RiskLevel,
      mood: [
        "Less playful, more serious.",
        "Reactions tighten up.",
        "Mood shifts are more likely.",
      ],
      libido: [
        "Interest is still there, less central.",
        "Physical interest is inconsistent.",
        "Not a priority day.",
      ],
      energy: [
        "Energy is steady, not high.",
        "Slower pace works better.",
        "No sprint energy.",
      ],
      stress: [
        "Irritation builds faster.",
        "Less tolerance for chaos.",
        "Friction escalates quicker.",
      ],
      communication: [
        "Be precise, not emotional.",
        "Clarity beats nuance.",
        "Say it once, cleanly.",
      ],
      focus: [
        "Predictability matters.",
        "Stability beats excitement.",
        "Reduce variables.",
      ],
      helps: [
        "Routine and structure.",
        "Clear expectations.",
        "No surprises.",
      ],
      avoid: [
        "Last-minute changes.",
        "Vague plans.",
        "Mixed signals.",
      ],
    },

    PMS: {
      risk: "High" as RiskLevel,
      mood: [
        "Reactions are sharper.",
        "Emotional spikes are more likely.",
        "Less margin for error.",
      ],
      libido: [
        "Interest is low priority.",
        "Physical interest is inconsistent.",
        "Not a focus right now.",
      ],
      energy: [
        "Energy dips are common.",
        "Fatigue shows up earlier.",
        "Lower output day.",
      ],
      stress: [
        "Small things feel bigger.",
        "Stress escalates quickly.",
        "Tolerance is thin.",
      ],
      communication: [
        "Less explaining, more listening.",
        "Avoid debates.",
        "Do not correct.",
      ],
      focus: [
        "Reduce friction.",
        "Keep the day contained.",
        "Prevent damage.",
      ],
      helps: [
        "Make things easier, not bigger.",
        "Lower the noise.",
        "Keep it simple.",
      ],
      avoid: [
        "Arguments.",
        "Logic battles.",
        "Unnecessary confrontation.",
      ],
    },
  }[phase];

  return {
    risk: base.risk,
    mood: pick(base.mood, dayIndex, 1),
    libido: pick(base.libido, dayIndex, 2),
    energy: pick(base.energy, dayIndex, 3),
    stress: pick(base.stress, dayIndex, 4),
    communication: pick(base.communication, dayIndex, 5),
    focus: pick(base.focus, dayIndex, 6),
    helps: pick(base.helps, dayIndex, 7),
    avoid: pick(base.avoid, dayIndex, 8),
  };
}

/* ================= UI ================= */

function NavigateInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const age = sp.get("age") || "";
  const day1Str = sp.get("day1") || "";
  const bleedOverride = Number(sp.get("bd") || DEFAULTS.bleedDays);

  const day1 = useMemo(() => new Date(day1Str + "T12:00:00"), [day1Str]);
  const today = new Date();

  const offset = Math.max(
    0,
    Math.floor(
      (startOfDay(today).getTime() - startOfDay(day1).getTime()) / 86400000
    )
  );

  function build(o: number): DayInfo {
    const date = addDays(day1, o);
    const dayIndex = o + 1;
    const phase = phaseForDay(dayIndex, bleedOverride);
    const c = copyFor(phase, dayIndex);
    return { date, dayIndex, phase, ...c };
  }

  const todayInfo = build(offset);
  const tomorrowInfo = build(offset + 1);

  const showBleedQuestion = todayInfo.dayIndex === DEFAULTS.bleedDays + 1;

  function extendBleed() {
    router.push(
      `/navigate?age=${age}&day1=${day1Str}&bd=${todayInfo.dayIndex}`
    );
  }

  return (
    <main style={{ maxWidth: 760, margin: "32px auto", padding: 16 }}>
      <h1>Day View</h1>

      {showBleedQuestion && (
        <div style={{ marginBottom: 16 }}>
          <strong>Period still going?</strong>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={extendBleed}>Yes</button>
            <button>No</button>
          </div>
        </div>
      )}

      {[{ label: "TODAY", d: todayInfo }, { label: "TOMORROW", d: tomorrowInfo }].map(
        ({ label, d }) => (
          <section key={label} style={{ marginBottom: 20 }}>
            <h3>
              {label} — {fmt(d.date)} (Day {d.dayIndex}, {d.phase})
            </h3>
            <ul>
              <li><b>Mood:</b> {d.mood}</li>
              <li><b>Libido:</b> {d.libido}</li>
              <li><b>Energy:</b> {d.energy}</li>
              <li><b>Stress:</b> {d.stress}</li>
              <li><b>Communication:</b> {d.communication}</li>
              <li><b>Focus:</b> {d.focus}</li>
              <li><b>Helps:</b> {d.helps}</li>
              <li><b>Avoid:</b> {d.avoid}</li>
            </ul>
          </section>
        )
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <NavigateInner />
    </Suspense>
  );
}
