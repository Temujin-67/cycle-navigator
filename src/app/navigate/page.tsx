"use client";

import Link from "next/link";
import React, { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";
type RiskLevel = "Low" | "Medium" | "High";

type DayInfo = {
  date: Date;
  dayIndex: number; // can exceed 28 if cycle hasn’t restarted
  phase: Phase;
  risk: RiskLevel;

  mood: string;
  libido: string;
  stress: string;
  communication: string;

  play: string; // replaces Focus + Helps
  avoid: string;

  fertility: string;
};

type DayRange = {
  start: number;
  end: number;
};

const DEFAULTS = {
  cycleLength: 28,
  bleedDays: 5, // check from Day 6 (5-day period possible)
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

function formatDayRangeAsDates(day1: Date, range: DayRange) {
  const start = Math.min(range.start, range.end);
  const end = Math.max(range.start, range.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || Number.isNaN(day1.getTime())) {
    return `Day ${range.start}-${range.end}`;
  }
  const startDate = addDays(day1, start - 1);
  const endDate = addDays(day1, end - 1);
  if (start === end) return fmt(startDate);
  return `${fmt(startDate)} - ${fmt(endDate)}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Unique forecast per day: no two days get the same 6-tuple of lines (mood, libido, stress, comm, play, avoid)
const FORECAST_COMBOS = 3 * 3 * 3 * 3 * 3 * 3; // 729
function pickUnique(lines: string[], dayIndex: number, fieldIndex: number) {
  const forecastId = (dayIndex * 97) % FORECAST_COMBOS;
  const indices = [
    forecastId % 3,
    Math.floor(forecastId / 3) % 3,
    Math.floor(forecastId / 9) % 3,
    Math.floor(forecastId / 27) % 3,
    Math.floor(forecastId / 81) % 3,
    Math.floor(forecastId / 243) % 3,
  ];
  return lines[indices[fieldIndex] % lines.length];
}

function phaseForDay(dayIndex: number, bleedOverride?: number, cycleLengthOverride?: number): Phase {
  const bleed = bleedOverride ?? DEFAULTS.bleedDays;
  const cycleLength = cycleLengthOverride ?? DEFAULTS.cycleLength;

  const ovCenter = Math.round(cycleLength / 2);
  const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;

  const pmsStart = cycleLength - DEFAULTS.pmsDays + 1;

  if (dayIndex <= bleed) return "Menstrual";
  if (dayIndex >= ovStart && dayIndex <= ovEnd) return "Ovulatory";
  if (dayIndex >= pmsStart) return "PMS";
  if (dayIndex > ovEnd && dayIndex < pmsStart) return "Luteal";
  return "Follicular";
}

function riskFor(phase: Phase): RiskLevel {
  if (phase === "PMS") return "High";
  if (phase === "Menstrual") return "High";
  if (phase === "Luteal") return "Medium";
  return "Low";
}

function ovulationMeta(dayIndex: number, cycleLengthOverride?: number) {
  const cycleLength = cycleLengthOverride ?? DEFAULTS.cycleLength;
  const peak = Math.round(cycleLength / 2);
  const fertileStart = peak - 2;
  const fertileEnd = peak + 1;
  return {
    peak,
    fertileStart,
    fertileEnd,
    isPeak: dayIndex === peak,
    inWindow: dayIndex >= fertileStart && dayIndex <= fertileEnd,
  };
}

function fertilityLine(dayIndex: number, cycleLengthOverride?: number) {
  const { isPeak, inWindow } = ovulationMeta(dayIndex, cycleLengthOverride);
  if (isPeak) return "Best day for it.";
  if (inWindow) return "High odds. Fertile window.";
  return "Lower odds.";
}

// Best / worst day ranges for this cycle (depends on bleed and cycle length)
function bestWorstRanges(bleedOverride: number, cycleLengthOverride?: number) {
  const bleed = bleedOverride ?? DEFAULTS.bleedDays;
  const cycleLength = cycleLengthOverride ?? DEFAULTS.cycleLength;
  const ovCenter = Math.round(cycleLength / 2);
  const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;
  const pmsStart = cycleLength - DEFAULTS.pmsDays + 1;
  const fertileStart = ovCenter - 2;
  const fertileEnd = ovCenter + 1;
  const bestStart = bleed + 1;
  const bestEnd = ovEnd;
  const worstStart = pmsStart;
  const worstEnd = cycleLength;
  return {
    bestTalk: { start: bestStart, end: bestEnd },
    bestDays: `Day ${bestStart}-${bestEnd}`,
    worstDays: `Day ${worstStart}-${worstEnd}`,
    bestLibidoDays: `Day ${ovStart}-${ovEnd}`,
    worstLibidoDays: `Day 1-${bleed}, ${pmsStart}-${worstEnd}`,
    bestPregnancyDays: `Day ${fertileStart}-${fertileEnd}`,
  };
}

// Phase-based emojis: bad mood never gets smiley, low libido never gets fire
function moodEmojiForPhase(phase: Phase): string {
  if (phase === "Menstrual" || phase === "PMS") return "😑";
  if (phase === "Luteal") return "😐";
  return "🙂"; // Follicular, Ovulatory
}

function libidoEmojiForPhase(phase: Phase): string {
  if (phase === "Menstrual" || phase === "PMS") return "🚫"; // none / leave it
  if (phase === "Ovulatory") return "🔥"; // high
  if (phase === "Follicular") return "📈"; // building / rising
  return "🟡"; // Luteal: moderate / variable
}

function stressEmojiForPhase(phase: Phase): string {
  if (phase === "Menstrual" || phase === "PMS") return "🔴";
  if (phase === "Luteal") return "🟠";
  return "🟢"; // Follicular, Ovulatory
}

// Field indices for unique forecast: 0=mood, 1=libido, 2=stress, 3=communication, 4=play, 5=avoid
function copyFor(phase: Phase, dayIndex: number) {
  if (phase === "Follicular") {
    return {
      mood: pickUnique(
        ["Better mood. Less hassle.", "Easier day. Fewer blow-ups.", "More even. Stuff goes smoother."],
        dayIndex,
        0
      ),
      libido: pickUnique(
        ["Interest is picking up.", "Better than last week.", "Easier day for that."],
        dayIndex,
        1
      ),
      stress: pickUnique(
        ["Won't blow up as easy.", "More patience today.", "Normal stuff doesn't set her off."],
        dayIndex,
        2
      ),
      communication: pickUnique(
        ["Say your bit, then leave it. Don’t turn it into a thing.", "Keep it short. No essays.", "Direct. Don’t waffle."],
        dayIndex,
        3
      ),
      play: pickUnique(
        ["Handle practical stuff. Decide and move on.", "Make a plan and stick to it.", "Get things done. Keep plans simple."],
        dayIndex,
        4
      ),
      avoid: pickUnique(
        ["Don't start fights over nothing.", "Don't nitpick.", "Don't make a big deal out of small stuff."],
        dayIndex,
        5
      ),
    };
  }

  if (phase === "Ovulatory") {
    return {
      mood: pickUnique(
        ["More open today.", "Up for stuff.", "Responds better."],
        dayIndex,
        0
      ),
      libido: pickUnique(
        ["Up for it today.", "Signals are clear.", "Obvious."],
        dayIndex,
        1
      ),
      stress: pickUnique(
        ["Harder to piss her off today.", "Less friction.", "Less defensive."],
        dayIndex,
        2
      ),
      communication: pickUnique(
        ["Say it, then drop it. Don’t turn it into a debate.", "How you say it matters. Keep it confident.", "Don’t waffle."],
        dayIndex,
        3
      ),
      play: pickUnique(
        ["Show up. Put in the effort.", "Be there. Don't half-ass it.", "Put in effort. Don't overdo it."],
        dayIndex,
        4
      ),
      avoid: pickUnique(
        ["Don't overthink it.", "Don't try too hard.", "Don't push."],
        dayIndex,
        5
      ),
    };
  }

  if (phase === "Menstrual") {
    return {
      mood: pickUnique(
        ["Less patience today.", "Short fuse today.", "Small stuff irritates faster."],
        dayIndex,
        0
      ),
      libido: pickUnique(
        ["Not in the mood today.", "Forget it today.", "Leave it."],
        dayIndex,
        1
      ),
      stress: pickUnique(
        ["Gets stressed fast.", "No patience for hassle.", "Short fuse."],
        dayIndex,
        2
      ),
      communication: pickUnique(
        ["Talk less or you'll get a row.", "Short. Facts only.", "Not the day for lectures."],
        dayIndex,
        3
      ),
      play: pickUnique(
        ["Essentials only. Skip the rest.", "Basics. Don’t add more.", "Keep it simple."],
        dayIndex,
        4
      ),
      avoid: pickUnique(
        ["Don't start the big talk.", "Don't push for a decision.", "Don't bring up what you can’t fix today."],
        dayIndex,
        5
      ),
    };
  }

  if (phase === "Luteal") {
    return {
      mood: pickUnique(
        ["Less playful. More serious.", "Mood varies.", "Gets annoyed easier."],
        dayIndex,
        0
      ),
      libido: pickUnique(
        ["Depends on her mood.", "Possible but not a given.", "Less consistent than last week."],
        dayIndex,
        1
      ),
      stress: pickUnique(
        ["Can't handle chaos today.", "Irritated easy.", "Push and you get friction."],
        dayIndex,
        2
      ),
      communication: pickUnique(
        ["Say it once, clear. Don’t turn it into a thing.", "Clear. Specific. No vague stuff.", "Short. Don’t reopen it."],
        dayIndex,
        3
      ),
      play: pickUnique(
        ["Stick to the plan. No surprises.", "Handle essentials. Keep it tidy.", "Routine. Avoid big topics."],
        dayIndex,
        4
      ),
      avoid: pickUnique(
        ["Don’t spring last-minute changes.", "Don’t push for 'We’ll see' to become yes.", "Don’t make a mess of things."],
        dayIndex,
        5
      ),
    };
  }

  // PMS
  return {
    mood: pickUnique(
      ["No room for error.", "Reacts sharp.", "Sensitive to how you say it."],
      dayIndex,
      0
    ),
    libido: pickUnique(
      ["Not a priority today.", "Forget it today.", "Unpredictable."],
      dayIndex,
      1
    ),
    stress: pickUnique(
      ["Small stuff feels big to her.", "Things escalate fast.", "Thin patience."],
      dayIndex,
      2
    ),
    communication: pickUnique(
      ["No debates.", "Don't correct her.", "Listen more. Explain less."],
      dayIndex,
      3
    ),
    play: pickUnique(
      ["Do the basics. Don’t poke.", "Reduce friction. Keep it calm.", "Don't make it worse. Keep it simple."],
      dayIndex,
      4
    ),
    avoid: pickUnique(
      ["Don’t bring up old arguments.", "Don’t push for a decision.", "Don’t critique her tone."],
      dayIndex,
      5
    ),
  };
}

function PhaseChip({ phase }: { phase: Phase }) {
  const m: Record<Phase, { border: string; emoji: string }> = {
    Menstrual: { border: "#FF3B7B", emoji: "🩸" },
    Follicular: { border: "#16A34A", emoji: "🌱" },
    Ovulatory: { border: "#F59E0B", emoji: "🔥" },
    Luteal: { border: "#2563EB", emoji: "🧠" },
    PMS: { border: "#EF4444", emoji: "⚡" },
  };

  const s = m[phase];
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: "var(--background)",
        color: "var(--foreground)",
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      <span aria-hidden="true">{s.emoji}</span>
      {phase} phase
    </span>
  );
}

function RiskChip({ risk }: { risk: RiskLevel }) {
  const m: Record<RiskLevel, { bg: string; fg: string; emoji: string }> = {
    Low: { bg: "#E8FFF1", fg: "#0B6B45", emoji: "🟢" },
    Medium: { bg: "#FFF6E5", fg: "#7A4B00", emoji: "🟠" },
    High: { bg: "#FFECEC", fg: "#7F1D1D", emoji: "🔴" },
  };
  const s = m[risk];
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.08)",
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      <span aria-hidden="true">{s.emoji}</span>
      Conflict risk: {risk}
    </span>
  );
}

function DayCard({ d, hidePregnancy }: { d: DayInfo; hidePregnancy?: boolean }) {
  const phaseBg: Record<Phase, { bg: string; border: string }> = {
    Menstrual: { bg: "#FFF1F5", border: "#FF3B7B" },
    Follicular: { bg: "#F1FFF5", border: "#16A34A" },
    Ovulatory: { bg: "#FFF7E6", border: "#F59E0B" },
    Luteal: { bg: "#EEF7FF", border: "#2563EB" },
    PMS: { bg: "#FFECEC", border: "#EF4444" },
  };

  const ps = phaseBg[d.phase];

  const row = (emoji: string, label: string, value: string) => (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 26, textAlign: "center", fontSize: 16 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.2, color: "var(--foreground)" }}>{label}</div>
        <div style={{ fontSize: 15, lineHeight: 1.35, color: "var(--foreground)", marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <section
      style={{
        border: `1px solid ${ps.border}`,
        background: ps.bg,
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontWeight: 1000 as any, fontSize: 18 }}>
          {fmt(d.date)} <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>· Day {d.dayIndex}</span>
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Swipe or use buttons</div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <PhaseChip phase={d.phase} />
        <RiskChip risk={d.risk} />
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {row(moodEmojiForPhase(d.phase), "Mood", d.mood)}
        {row(libidoEmojiForPhase(d.phase), "Libido", d.libido)}
        {row(stressEmojiForPhase(d.phase), "Stress", d.stress)}
        {row("💬", "Communication", d.communication)}
        {row("🎯", "Today", d.play)}
        {row("🚫", "Avoid", d.avoid)}
        {!hidePregnancy && row("🤰", "Pregnancy odds", d.fertility)}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.35 }}>
        <strong><Link href="/disclaimer" style={{ color: "inherit", textDecoration: "underline" }}>Disclaimer</Link>:</strong> Info only. Not for contraception or medical decisions. Not medical advice.
      </div>
    </section>
  );
}

function NavigateInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const age = sp.get("age") || "";
  const day1Str = sp.get("day1") || "";
  const bleedOverride = Number(sp.get("bd") || DEFAULTS.bleedDays);
  const cycleLength = Number(sp.get("cl") || DEFAULTS.cycleLength);

  const [dismissBleedPrompt, setDismissBleedPrompt] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewCycleConfirm, setShowNewCycleConfirm] = useState(false);
  const [hidePregnancy, setHidePregnancy] = useState(false);

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const v = window.localStorage.getItem("cf_hide_pregnancy");
        setHidePregnancy(v === "1");
      }
    } catch {}
  }, []);

  function toggleHidePregnancy() {
    const next = !hidePregnancy;
    setHidePregnancy(next);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("cf_hide_pregnancy", next ? "1" : "0");
    } catch {}
    setMenuOpen(false);
  }

  const day1 = useMemo(() => new Date(day1Str + "T12:00:00"), [day1Str]);
  const today = new Date();

  // When cycle (day1) changes, reset view and bleed prompt
  React.useEffect(() => {
    setDelta(0);
    setDismissBleedPrompt(false);
  }, [day1Str]);

  const baseOffset = useMemo(() => {
    const a = startOfDay(today).getTime();
    const b = startOfDay(day1).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return 0;
    return Math.max(0, Math.floor((a - b) / 86400000));
  }, [today, day1]);

  // Swipeable delta (0 = today)
  const [delta, setDelta] = useState(0);
  const viewOffset = (Number.isNaN(baseOffset) ? 0 : baseOffset) + delta;

  const build = (o: number): DayInfo => {
    const safeO = Number.isNaN(o) || o < 0 ? 0 : o;
    const date = addDays(day1, safeO);
    const dayIndex = safeO + 1;
    const phase = phaseForDay(dayIndex, bleedOverride, cycleLength);
    const risk = riskFor(phase);
    const c = copyFor(phase, dayIndex);
    const fertility = fertilityLine(dayIndex, cycleLength);
    return { date, dayIndex, phase, risk, fertility, ...c };
  };

  const current = useMemo(() => build(viewOffset), [viewOffset, bleedOverride, cycleLength]);
  const ranges = useMemo(() => bestWorstRanges(bleedOverride, cycleLength), [bleedOverride, cycleLength]);

  // Ask "period over?" on first day after current assumed bleed (Day 6 if default 5, then 7, 8...)
  const showBleedQuestion = !dismissBleedPrompt && current.dayIndex === bleedOverride + 1;
  // "New period?" from Day 28; no dismiss state – prompt reappears every day until they tap "Yeah, new cycle"
  const showNewPeriodQuestion =
    Number.isFinite(current.dayIndex) && current.dayIndex >= 28;
  const isOverdueBanner = current.dayIndex >= 35;

  const qpBase = `age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}&cl=${encodeURIComponent(String(cycleLength))}`;

  function extendBleedToCurrentDay() {
    router.push(`/navigate?${qpBase}&bd=${encodeURIComponent(String(current.dayIndex))}`);
    router.refresh();
  }

  function setBleedToDay(day: number) {
    router.push(`/navigate?${qpBase}&bd=${encodeURIComponent(String(day))}`);
    router.refresh();
  }

  function startNewCycle() {
    setShowNewCycleConfirm(false);
    setMenuOpen(false);
    const d = new Date();
    const newDay1Str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const learnedCl = current.dayIndex;
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("cf_cycle_history");
        const prev = raw ? JSON.parse(raw) : [];
        const next = [...prev, learnedCl].slice(-5);
        window.localStorage.setItem("cf_cycle_history", JSON.stringify(next));
        setCycleHistory(next);
      }
    } catch (_) {}
    router.replace(
      `/navigate?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(newDay1Str)}&bd=5&cl=${learnedCl}`
    );
    router.refresh();
  }

  const [cycleHistory, setCycleHistory] = useState<number[]>([]);
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cf_cycle_history");
      setCycleHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setCycleHistory([]);
    }
  }, []);

  const newCyclePreviewLength = current.dayIndex;
  const combinedHistory = [...cycleHistory, newCyclePreviewLength].slice(-5);
  const newCyclePreviewAvg =
    combinedHistory.length > 0
      ? Math.round(combinedHistory.reduce((a, b) => a + b, 0) / combinedHistory.length)
      : newCyclePreviewLength;

  // --- Swipe handling (no libs) ---
  const drag = useRef({
    active: false,
    startX: 0,
    dx: 0,
  });
  const touchStartX = useRef(0);

  const [dragPx, setDragPx] = useState(0);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current.active = true;
    drag.current.startX = e.clientX;
    drag.current.dx = 0;
    setDragPx(0);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.dx = dx;
    setDragPx(dx);
  };

  const onPointerEnd = (e?: React.PointerEvent) => {
    if (e?.pointerType === "touch") return; // let touch handlers handle it
    if (!drag.current.active) return;
    drag.current.active = false;

    const dx = drag.current.dx;

    // threshold
    if (dx <= -70) {
      // swipe left → next day
      setDelta((v) => v + 1);
    } else if (dx >= 70) {
      // swipe right → previous day (but don’t go below Day 1)
      setDelta((v) => Math.max(v - 1, -baseOffset));
    }

    setDragPx(0);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    e.preventDefault();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setDragPx(e.touches[0].clientX - touchStartX.current);
    e.preventDefault();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx <= -70) {
      setDelta((v) => v + 1);
    } else if (dx >= 70) {
      setDelta((v) => Math.max(v - 1, -baseOffset));
    }
    setDragPx(0);
  };

  const onTouchCancel = () => {
    setDragPx(0);
  };

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "18px auto",
        padding: 14,
        fontFamily: "system-ui",
        color: "var(--foreground)",
        background: "var(--background)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 1000 as any, letterSpacing: -0.2 }}>Cycle Forecast</div>
          {delta === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Today: {build(baseOffset).phase} phase — Conflict risk: {build(baseOffset).risk}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 13, textDecoration: "none", fontWeight: 900 }}>
            🏠 Home
          </Link>
          <Link href="/about" style={{ fontSize: 13, textDecoration: "none", fontWeight: 900 }}>
            About
          </Link>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              style={{
                padding: "6px 8px",
                border: "1px solid var(--input-border)",
                borderRadius: 8,
                background: "var(--input-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 4,
                    zIndex: 20,
                    minWidth: 200,
                    padding: "8px 0",
                    background: "var(--background)",
                    border: "1px solid var(--input-border)",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCycleConfirm(true);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      color: "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Start New Cycle Now
                  </button>
                  <Link
                    href={`/?day1=${encodeURIComponent(day1Str)}&age=${encodeURIComponent(age)}`}
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      textAlign: "left",
                      color: "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Edit Last Period Date
                  </Link>
                  <button
                    type="button"
                    onClick={toggleHidePregnancy}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      color: "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {hidePregnancy ? "Show Pregnancy Section" : "Hide Pregnancy Section"}
                  </button>
                  <Link
                    href="/about"
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      color: "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/disclaimer"
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      color: "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Disclaimer
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showNewCycleConfirm && (
        <section
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 14,
            border: "1px solid var(--button-primary)",
            background: "#F1FFF5",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontWeight: 1000 as any, color: "var(--foreground)", marginBottom: 6 }}>
            Confirm new cycle
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            This cycle was {current.dayIndex} days. New average: {newCyclePreviewAvg} days.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={startNewCycle}
              style={{
                border: "1px solid var(--button-primary)",
                background: "var(--button-primary)",
                color: "var(--button-primary-color)",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowNewCycleConfirm(false)}
              style={{
                border: "1px solid var(--input-border)",
                background: "var(--background)",
                color: "var(--foreground)",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Best day / Worst day for this cycle */}
      <section style={{ marginTop: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#F1FFF5",
              border: "1px solid #16A34A",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0B6B45", marginBottom: 4 }}>Best time to talk</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{bestWorstRanges(bleedOverride, cycleLength).bestDays}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>Talk, plan, chill.</div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#FFECEC",
              border: "1px solid #EF4444",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7F1D1D", marginBottom: 4 }}>Worst time for</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{bestWorstRanges(bleedOverride, cycleLength).worstDays}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>Heavy talks, pushing for answers, rows.</div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            marginTop: 10,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#FFF7E6",
              border: "1px solid #F59E0B",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7A4B00", marginBottom: 4 }}>Best for libido</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{bestWorstRanges(bleedOverride, cycleLength).bestLibidoDays}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>She's up for it. You'll know.</div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#FFECEC",
              border: "1px solid #EF4444",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7F1D1D", marginBottom: 4 }}>Worst for libido</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{bestWorstRanges(bleedOverride, cycleLength).worstLibidoDays}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>Not in the mood. Don't push it.</div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#EEF7FF",
              border: "1px solid #2563EB",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0B4A84", marginBottom: 4 }}>Best for pregnancy</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{bestWorstRanges(bleedOverride, cycleLength).bestPregnancyDays}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>Fertile window. Highest odds.</div>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#F1FFF5", border: "1px solid #16A34A" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#0B6B45", marginBottom: 4 }}>Best time for the hard chat</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{formatDayRangeAsDates(day1, ranges.bestTalk)} (Follicular phase)</div>
        </div>
        {cycleHistory.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-secondary)" }}>
            Last {cycleHistory.length} cycle{cycleHistory.length !== 1 ? "s" : ""}: {cycleHistory.join(", ")} days
          </div>
        )}
      </section>

      {showBleedQuestion && (
        <section
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 14,
            border: "1px solid var(--input-border)",
            background: "var(--background)",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontWeight: 1000 as any, color: "var(--foreground)" }}>Day {current.dayIndex}: still on?</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            Usually 5–7 days. Tell us when it's over so the phases line up.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button
              onClick={extendBleedToCurrentDay}
              style={{
                border: "1px solid var(--button-primary)",
                background: "var(--button-primary)",
                color: "var(--button-primary-color)",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              Still going
            </button>

            <button
              onClick={() => setDismissBleedPrompt(true)}
              style={{
                border: "1px solid var(--input-border)",
                background: "var(--background)",
                color: "var(--foreground)",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              Over
            </button>
          </div>

          {current.dayIndex > 2 && (
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-secondary)" }}>
              Ended earlier — day{" "}
              <select
                value={bleedOverride}
                onChange={(e) => setBleedToDay(Number(e.target.value))}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid var(--input-border)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {Array.from({ length: current.dayIndex - 1 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}

      {showNewPeriodQuestion && !showNewCycleConfirm && (
        <section
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 14,
            border: "1px solid #16A34A",
            background: "#F1FFF5",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontWeight: 1000 as any, color: "var(--foreground)" }}>
            {isOverdueBanner ? "Cycle overdue – ready to start a new one?" : `Day ${current.dayIndex}: new period?`}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            Tap to start fresh. We&apos;ll use this length ({current.dayIndex} days) for the next cycle.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button
              onClick={() => setShowNewCycleConfirm(true)}
              style={{
                border: "1px solid var(--button-primary)",
                background: "var(--button-primary)",
                color: "var(--button-primary-color)",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              Yeah, new cycle
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            If not yet, swipe to another day.
          </div>
        </section>
      )}

      <div style={{ marginTop: 14 }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => onPointerEnd(e)}
          onPointerCancel={(e) => onPointerEnd(e)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          style={{
            touchAction: "none",
            transform: `translateX(${dragPx}px)`,
            transition: drag.current.active ? "none" : "transform 160ms ease-out",
          }}
        >
          <DayCard d={current} hidePregnancy={hidePregnancy} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
          <button
            onClick={() => setDelta((v) => Math.max(v - 1, -baseOffset))}
            style={{
              flex: 1,
              border: "1px solid var(--input-border)",
              background: "var(--background)",
              color: "var(--foreground)",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 1000 as any,
              cursor: "pointer",
            }}
          >
            ◀ Prev
          </button>
          <button
            onClick={() => setDelta((v) => v + 1)}
            style={{
              flex: 1,
              border: "1px solid var(--button-primary)",
              background: "var(--button-primary)",
              color: "var(--button-primary-color)",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 1000 as any,
              cursor: "pointer",
            }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16, fontFamily: "system-ui" }}>Loading…</div>}>
      <NavigateInner />
    </Suspense>
  );
}
