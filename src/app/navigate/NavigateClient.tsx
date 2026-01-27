"use client";

import Link from "next/link";
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

function riskFor(phase: Phase) {
  if (phase === "PMS") return { risk: "High sensitivity", riskNote: "Emotions may spike faster." };
  if (phase === "Menstrual") return { risk: "Be mindful", riskNote: "Lower energy and tolerance." };
  if (phase === "Luteal") return { risk: "Be mindful", riskNote: "More variability possible." };
  return { risk: "Low friction", riskNote: "Generally easier interaction window." };
}

function copy(phase: Phase, age: number) {
  const t = ageTone(age);

  if (phase === "Menstrual")
    return {
      mood: "More inward, comfort-seeking.",
      libido: "Lower, comfort-focused.",
      energy: "Lower energy.",
      stress: `Lower tolerance. Sensitivity ${t.sensitivity}.`,
      communication: "Gentle, no pressure.",
      partnerFocus: "Support and comfort.",
      helps: "Warmth, reassurance.",
      avoid: "Pushing decisions.",
    };

  if (phase === "Ovulatory")
    return {
      mood: "Confident, expressive.",
      libido: "High desire window.",
      energy: "High energy.",
      stress: "High tolerance.",
      communication: "Playful and open.",
      partnerFocus: "Connection and affection.",
      helps: "Attention, dates.",
      avoid: "Emotional distance.",
    };

  if (phase === "Luteal")
    return {
      mood: "More serious.",
      libido: "Moderate to lower.",
      energy: "Steady.",
      stress: "Rising sensitivity.",
      communication: "Clear and calm.",
      partnerFocus: "Predictability.",
      helps: "Routine.",
      avoid: "Last-minute changes.",
    };

  return {
    mood: "Stable and clear.",
    libido: "Rising.",
    energy: "Improving.",
    stress: "Good resilience.",
    communication: "Collaborative.",
    partnerFocus: "Planning together.",
    helps: "Structure.",
    avoid: "Dismissiveness.",
  };
}

export default function NavigateClient() {
  const sp = useSearchParams();
  const age = Number(sp.get("age") || 0);
  const day1Str = sp.get("day1") || "";

  const day1 = useMemo(() => new Date(day1Str + "T12:00:00"), [day1Str]);
  const today = new Date();

  const offset = Math.floor(
    (today.setHours(0, 0, 0, 0) - day1.setHours(0, 0, 0, 0)) / 86400000
  );

  const build = (o: number): DayInfo => {
    const date = addDays(day1, o);
    const dayIndex = (o % DEFAULTS.cycleLength) + 1;
    const phase = phaseForDay(dayIndex);
    const risk = riskFor(phase);
    return { date, dayIndex, phase, ...risk, ...copy(phase, age) };
  };

  const todayInfo = build(offset);
  const tomorrowInfo = build(offset + 1);

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      <h1>Today / Tomorrow</h1>

      {[{ label: "TODAY", d: todayInfo }, { label: "TOMORROW", d: tomorrowInfo }].map(
        ({ label, d }) => (
          <section key={label} style={{ marginTop: 20 }}>
            <strong>{label}</strong> — {fmt(d.date)} — {d.phase}
            <div><b>Risk:</b> {d.risk}</div>
            <div><b>Mood:</b> {d.mood}</div>
            <div><b>Libido:</b> {d.libido}</div>
            <div><b>Energy:</b> {d.energy}</div>
            <div><b>Helps:</b> {d.helps}</div>
            <div><b>Avoid:</b> {d.avoid}</div>
          </section>
        )
      )}
    </main>
  );
}

