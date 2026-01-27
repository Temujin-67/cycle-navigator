"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";

type DayInfo = {
  date: Date;
  dayIndex: number; // 1..28
  phase: Phase;
  mood: string;
  libido: string;
  energy: string;
  stress: string;
  communication: string;
  partnerFocus: string;
};

const DEFAULTS = {
  cycleLength: 28,
  bleedDays: 5,
  pmsDays: 5,
  ovulationWindow: 3, // mid-cycle ±1
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(12, 0, 0, 0);
  return x;
}

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
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

  const ovCenter = Math.round(cycleLength / 2); // ~14
  const ovHalf = Math.floor(ovulationWindow / 2); // 1
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;

  const pmsStart = cycleLength - pmsDays + 1;

  if (dayIndex >= 1 && dayIndex <= bleedDays) return "Menstrual";
  if (dayIndex >= ovStart && dayIndex <= ovEnd) return "Ovulatory";
  if (dayIndex >= pmsStart) return "PMS";
  if (dayIndex > ovEnd && dayIndex < pmsStart) return "Luteal";
  return "Follicular";
}

function copy(phase: Phase, age: number) {
  const t = ageTone(age);

  if (phase === "Menstrual") {
    return {
      mood: `More inward and comfort-seeking; emotions can feel softer. Variability is ${t.variability}.`,
      libido: "Often lower interest in sex; closeness may be more about comfort than intensity.",
      energy: "Lower stamina is common; slower days can feel easier.",
      stress: `Lower tolerance for friction, often due to fatigue/discomfort. Sensitivity is ${t.sensitivity}.`,
      communication: "Gentle tone, simple questions, no pressure for decisions.",
      partnerFocus: "Support first: offer help, keep plans light, avoid surprise debates.",
    };
  }

  if (phase === "Follicular") {
    return {
      mood: `Often lighter and clearer; mood tends to feel more stable. Variability is ${t.variability}.`,
      libido: "Interest often rises gradually; affection and openness can increase.",
      energy: "Energy usually improves; motivation can feel higher.",
      stress: "Resilience is often better; small issues feel less charged.",
      communication: "Direct, collaborative conversation usually lands well.",
      partnerFocus: "Good window for planning, logistics, and normal problem-solving talks.",
    };
  }

  if (phase === "Ovulatory") {
    return {
      mood: `Often more confident and expressive; social appetite can rise. Variability is ${t.variability}.`,
      libido: "Commonly the strongest window for desire and playful connection.",
      energy: "High drive is more likely; she may feel outgoing.",
      stress: "Tolerance is often strong; repair after friction can be faster.",
      communication: "Warm, direct, playful communication usually works best.",
      partnerFocus: "Prioritise bonding: dates, affection, and positive attention tend to land well.",
    };
  }

  if (phase === "Luteal") {
    return {
      mood: `More serious or reflective; mild swings can happen. Variability is ${t.variability}.`,
      libido: "Often moderate then trending down; she may be more selective.",
      energy: "Steady but not peak; motivation may be less consistent.",
      stress: `Sensitivity often rises gradually as days progress. Sensitivity is ${t.sensitivity}.`,
      communication: "Clarity helps; avoid pressure and keep requests specific.",
      partnerFocus: "Keep things predictable and calm; reduce last-minute changes if possible.",
    };
  }

  // PMS
  return {
    mood: `More emotionally sensitive; irritation or sadness can surface faster. Variability is ${t.variability}.`,
    libido: "Often lower or inconsistent; closeness may need more safety and patience.",
    energy: "Lower energy is common; overwhelm can come quicker.",
    stress: `High reactivity window: small inputs can feel big. Sensitivity is ${t.sensitivity}.`,
    communication: "Validate first, keep tone soft, avoid ‘logic battles’.",
    partnerFocus: "De-escalate: simplify plans, reassure, and postpone heavy topics where possible.",
  };
}

function buildDay(day1: Date, age: number, offset: number): DayInfo {
  const { cycleLength } = DEFAULTS;

  const date = addDays(day1, offset);
  const dayIndex = ((offset % cycleLength) + 1) as number;
  const phase = phaseForDay(dayIndex);
  const c = copy(phase, age);

  return {
    date,
    dayIndex,
    phase,
    ...c,
  };
}

export default function NavigatePage() {
  const sp = useSearchParams();

  const age = sp.get("age") || "";
  const day1Str = sp.get("day1") || "";

  const ageNum = Number(age || "0");

  const day1 = useMemo(() => {
    const d = new Date(day1Str + "T12:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [day1Str]);

  const today = useMemo(() => new Date(), []);
  const offsetToday = useMemo(() => {
    if (!day1) return 0;
    const a = new Date(today);
    a.setHours(0, 0, 0, 0);
    const b = new Date(day1);
    b.setHours(0, 0, 0, 0);
    const diff = a.getTime() - b.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [day1, today]);

  const todayInfo = useMemo(() => {
    if (!day1 || !ageNum) return null;
    return buildDay(day1, ageNum, offsetToday < 0 ? 0 : offsetToday);
  }, [day1, ageNum, offsetToday]);

  const tomorrowInfo = useMemo(() => {
    if (!day1 || !ageNum) return null;
    const base = offsetToday < 0 ? 0 : offsetToday;
    return buildDay(day1, ageNum, base + 1);
  }, [day1, ageNum, offsetToday]);

  if (!age || !day1) {
    return (
      <main style={{ maxWidth: 520, margin: "60px auto", padding: 20, fontFamily: "system-ui" }}>
        <h1>Cycle Navigator</h1>
        <p style={{ color: "#444" }}>Missing inputs. Go back and enter age + Day 1.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ marginTop: 0 }}>Today / Tomorrow</h1>
        <Link
          href={`/calendar?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}`}
          style={{ fontSize: 14 }}
        >
          Monthly view
        </Link>
      </div>

      <div style={{ fontSize: 13, color: "#444", marginBottom: 14 }}>
        Built on hormonal cycle patterns. Individual responses may differ. Real life always overrides predictions.
      </div>

      <section style={{ border: "1px solid #e6e6e6", borderRadius: 12, padding: 14, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <strong>TODAY</strong>
          <span style={{ color: "#666", fontSize: 13 }}>{todayInfo ? fmt(todayInfo.date) : ""}</span>
        </div>

        {todayInfo && (
          <>
            <div style={{ marginTop: 10, fontWeight: 700 }}>
              Day {todayInfo.dayIndex} — {todayInfo.phase}
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.35 }}>
              <div><b>Mood:</b> {todayInfo.mood}</div>
              <div><b>Libido:</b> {todayInfo.libido}</div>
              <div><b>Energy:</b> {todayInfo.energy}</div>
              <div><b>Stress response:</b> {todayInfo.stress}</div>
              <div><b>Communication:</b> {todayInfo.communication}</div>
              <div><b>Partner focus:</b> {todayInfo.partnerFocus}</div>
            </div>
          </>
        )}
      </section>

      <section style={{ marginTop: 14, border: "1px solid #e6e6e6", borderRadius: 12, padding: 14, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <strong>TOMORROW</strong>
          <span style={{ color: "#666", fontSize: 13 }}>{tomorrowInfo ? fmt(tomorrowInfo.date) : ""}</span>
        </div>

        {tomorrowInfo && (
          <>
            <div style={{ marginTop: 10, fontWeight: 700 }}>
              Day {tomorrowInfo.dayIndex} — {tomorrowInfo.phase}
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.35 }}>
              <div><b>Mood:</b> {tomorrowInfo.mood}</div>
              <div><b>Libido:</b> {tomorrowInfo.libido}</div>
              <div><b>Energy:</b> {tomorrowInfo.energy}</div>
              <div><b>Stress response:</b> {tomorrowInfo.stress}</div>
              <div><b>Communication:</b> {tomorrowInfo.communication}</div>
              <div><b>Partner focus:</b> {tomorrowInfo.partnerFocus}</div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
