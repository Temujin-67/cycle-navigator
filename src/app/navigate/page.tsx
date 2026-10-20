// CHANGED LINES:
// - src/app/navigate/page.tsx
//   - Added touch axis intent detection refs (touchStartY, touchMode)
//   - onTouchStart(): record X+Y, reset mode, do NOT preventDefault
//   - onTouchMove(): only preventDefault + set dragPx when horizontal intent detected; otherwise allow native vertical scroll
//   - onTouchEnd(): only apply swipe + reset dragPx when horizontal intent detected; always reset mode
//   - Swipe container style: touchAction changed from "none" to "pan-y" to restore vertical scrolling while keeping horizontal swipe logic

"use client";

import Link from "next/link";
import React, { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LIMITS,
  addCycleToHistory,
  averageCycleLength,
  forecastUrl,
  isRealCycleLength,
  loadSettings,
  parseBleedDays,
  parseCycleLength,
  saveSettings,
} from "../../lib/settings";

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

  headline: string; // the one big line at the top of the day card
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

// Human date: "6th of Feb 26"
function formatHumanDate(date: Date) {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear().toString().slice(-2);
  return `${day}${suffix} of ${month} ${year}`;
}

function formatHumanDateRange(start: Date, end: Date) {
  return `${formatHumanDate(start)} – ${formatHumanDate(end)}`;
}

// Month overview: NO YEAR (e.g., "6th of Feb")
function formatHumanDateNoYear(date: Date) {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  const month = date.toLocaleString("en-GB", { month: "short" });
  return `${day}${suffix} of ${month}`;
}

function formatHumanDateRangeNoYear(start: Date, end: Date) {
  return `${formatHumanDateNoYear(start)} – ${formatHumanDateNoYear(end)}`;
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

function phaseForDay(
  dayIndex: number,
  bleedOverride?: number,
  cycleLengthOverride?: number
): Phase {
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

// Best / worst day ranges for this cycle (depends on bleed and cycle length)
function bestWorstRanges(bleedOverride: number, cycleLengthOverride?: number) {
  const bleed = bleedOverride ?? DEFAULTS.bleedDays;
  const cycleLength = cycleLengthOverride ?? DEFAULTS.cycleLength;
  const ovCenter = Math.round(cycleLength / 2);
  const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;
  const pmsStart = cycleLength - DEFAULTS.pmsDays + 1;
  const bestStart = bleed + 1;
  const bestEnd = ovEnd;
  const worstStart = pmsStart;
  const worstEnd = cycleLength;
  return {
    bestDays: `Day ${bestStart}-${bestEnd}`,
    worstDays: `Day ${worstStart}-${worstEnd}`,
    bestLibidoDays: `Day ${ovStart}-${ovEnd}`,
    worstLibidoDays: `Day 1-${bleed}, ${pmsStart}-${worstEnd}`,
  };
}

// Phase-based emojis: bad mood never gets smiley, low libido never gets fire
function moodEmojiForPhase(phase: Phase): string {
  if (phase === "Menstrual" || phase === "PMS") return "😑";
  if (phase === "Luteal") return "😐";
  return "🙂"; // Follicular, Ovulatory
}

function libidoEmojiForPhase(phase: Phase): string {
  // Soft icons on purpose: a stop sign or a flame would read her availability from the calendar.
  if (phase === "Menstrual" || phase === "PMS") return "🌙"; // go slow
  if (phase === "Ovulatory") return "✨"; // often more social
  if (phase === "Follicular") return "📈"; // building / rising
  return "🟡"; // Luteal: moderate / variable
}

function stressEmojiForPhase(phase: Phase): string {
  if (phase === "Menstrual" || phase === "PMS") return "🔴";
  if (phase === "Luteal") return "🟠";
  return "🟢"; // Follicular, Ovulatory
}

// Field indices for unique forecast: 0=mood, 1=libido, 2=stress, 3=communication, 4=play, 5=avoid
// One big line per day. Three per phase, rotated by day.
const HEADLINES: Record<Phase, string[]> = {
  Follicular: ["Good day to get things done.", "Green light. Use it.", "Smooth sailing, mostly."],
  Ovulatory: ["Harder to piss her off today.", "Best day of the cycle to show up.", "Good day. Don't waste it."],
  Menstrual: ["Short fuse today.", "Keep it simple today.", "Low patience. Stay out of the way."],
  Luteal: ["Keep it tidy today.", "No surprises today.", "Patience is running low."],
  PMS: ["No room for error.", "Walk carefully today.", "Eggshells day."],
};

function headlineFor(phase: Phase, dayIndex: number) {
  const lines = HEADLINES[phase];
  return lines[dayIndex % lines.length];
}

function copyFor(phase: Phase, dayIndex: number) {
  if (phase === "Follicular") {
    return {
      mood: pickUnique(
        ["Better mood. Less hassle.", "Easier day. Fewer blow-ups.", "More even. Stuff goes smoother."],
        dayIndex,
        0
      ),
      libido: pickUnique(["Interest may be picking up.", "Often a bit better than last week.", "A fair day to flirt. Still ask."], dayIndex, 1),
      stress: pickUnique(["Won't blow up as easy.", "More patience today.", "Normal stuff doesn't set her off."], dayIndex, 2),
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
      avoid: pickUnique(["Don't start fights over nothing.", "Don't nitpick.", "Don't make a big deal out of small stuff."], dayIndex, 5),
    };
  }

  if (phase === "Ovulatory") {
    return {
      mood: pickUnique(["More open today.", "Up for stuff.", "Responds better."], dayIndex, 0),
      libido: pickUnique(["May feel more social and flirty. Ask, don't assume.", "Often a higher-energy day. A calendar can't say yes.", "Flirting may land better. Read her, not the calendar."], dayIndex, 1),
      stress: pickUnique(["Harder to piss her off today.", "Less friction.", "Less defensive."], dayIndex, 2),
      communication: pickUnique(
        ["Say it, then drop it. Don’t turn it into a debate.", "How you say it matters. Keep it confident.", "Don’t waffle."],
        dayIndex,
        3
      ),
      play: pickUnique(["Show up. Put in the effort.", "Be there. Don't half-ass it.", "Put in effort. Don't overdo it."], dayIndex, 4),
      avoid: pickUnique(["Don't overthink it.", "Don't try too hard.", "Don't push."], dayIndex, 5),
    };
  }

  if (phase === "Menstrual") {
    return {
      mood: pickUnique(["Less patience today.", "Short fuse today.", "Small stuff irritates faster."], dayIndex, 0),
      libido: pickUnique(["Intimacy may not be on her mind. Don't push.", "Go easy. Let her lead.", "Don't push it. Ask what she feels like."], dayIndex, 1),
      stress: pickUnique(["Gets stressed fast.", "No patience for hassle.", "Short fuse."], dayIndex, 2),
      communication: pickUnique(["Talk less or you'll get a row.", "Short. Facts only.", "Not the day for lectures."], dayIndex, 3),
      play: pickUnique(["Essentials only. Skip the rest.", "Basics. Don’t add more.", "Keep it simple."], dayIndex, 4),
      avoid: pickUnique(["Don't start the big talk.", "Don't push for a decision.", "Don't bring up what you can’t fix today."], dayIndex, 5),
    };
  }

  if (phase === "Luteal") {
    return {
      mood: pickUnique(["Less playful. More serious.", "Mood varies.", "Gets annoyed easier."], dayIndex, 0),
      libido: pickUnique(["Varies a lot. Ask, don't guess.", "Could go either way. Let her lead.", "Often less consistent than last week."], dayIndex, 1),
      stress: pickUnique(["Can't handle chaos today.", "Irritated easy.", "Push and you get friction."], dayIndex, 2),
      communication: pickUnique(
        ["Say it once, clear. Don’t turn it into a thing.", "Clear. Specific. No vague stuff.", "Short. Don’t reopen it."],
        dayIndex,
        3
      ),
      play: pickUnique(["Stick to the plan. No surprises.", "Handle essentials. Keep it tidy.", "Routine. Avoid big topics."], dayIndex, 4),
      avoid: pickUnique(["Don’t spring last-minute changes.", "Don’t push for 'We’ll see' to become yes.", "Don’t make a mess of things."], dayIndex, 5),
    };
  }

  // PMS
  return {
    mood: pickUnique(["No room for error.", "Reacts sharp.", "Sensitive to how you say it."], dayIndex, 0),
    libido: pickUnique(["Intimacy may not be a priority. Don't push.", "Go easy. Let her lead.", "Unpredictable. Ask first."], dayIndex, 1),
    stress: pickUnique(["Small stuff feels big to her.", "Things escalate fast.", "Thin patience."], dayIndex, 2),
    communication: pickUnique(["No debates.", "Don't correct her.", "Listen more. Explain less."], dayIndex, 3),
    play: pickUnique(["Do the basics. Don’t poke.", "Reduce friction. Keep it calm.", "Don't make it worse. Keep it simple."], dayIndex, 4),
    avoid: pickUnique(["Don’t bring up old arguments.", "Don’t push for a decision.", "Don’t critique her tone."], dayIndex, 5),
  };
}

function PhaseChip({ phase }: { phase: Phase }) {
  const m: Record<Phase, { border: string; emoji: string }> = {
    Menstrual: { border: "#FF3B7B", emoji: "🩸" },
    Follicular: { border: "#16A34A", emoji: "🌱" },
    Ovulatory: { border: "#F59E0B", emoji: "☀️" },
    Luteal: { border: "#2563EB", emoji: "🧠" },
    PMS: { border: "#EA580C", emoji: "⚡" },
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
        fontSize: 14,
        fontWeight: 900,
      }}
    >
      <span aria-hidden="true">{s.emoji}</span>
      {phase} phase
    </span>
  );
}

function DayCard({ d }: { d: DayInfo }) {
  const phaseBg: Record<Phase, { bg: string; border: string }> = {
    Menstrual: { bg: "#FFF1F5", border: "#FF3B7B" },
    Follicular: { bg: "#F1FFF5", border: "#16A34A" },
    Ovulatory: { bg: "#FFF7E6", border: "#F59E0B" },
    Luteal: { bg: "#EEF7FF", border: "#2563EB" },
    PMS: { bg: "#FFF1E8", border: "#EA580C" },
  };

  const ps = phaseBg[d.phase];

  // `warn` puts the row in its own white box with a red outline (used for "Avoid").
  const row = (emoji: string, label: string, value: string, warn = false) => (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        ...(warn
          ? { background: "#FFFFFF", border: "1.5px solid #FCA5A5", borderRadius: 12, padding: "10px 12px" }
          : {}),
      }}
    >
      <div style={{ width: 28, textAlign: "center", fontSize: 20 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.2, color: warn ? "#B91C1C" : "var(--foreground)" }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 17,
            lineHeight: 1.35,
            color: "#171717",
            marginTop: 2,
            fontWeight: warn ? 600 : 400,
          }}
        >
          {value}
        </div>
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
          {formatHumanDate(d.date)} <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>· Day {d.dayIndex}</span>
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Swipe or use buttons</div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <PhaseChip phase={d.phase} />
      </div>

      <div style={{ marginTop: 14, fontWeight: 800, fontSize: 30, lineHeight: 1.08, letterSpacing: -0.4, color: "#171717" }}>
        {d.headline}
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
        {row(moodEmojiForPhase(d.phase), "Mood", d.mood)}
        {row(libidoEmojiForPhase(d.phase), "Libido", d.libido)}
        {row(stressEmojiForPhase(d.phase), "Stress", d.stress)}
        {row("💬", "Communication", d.communication)}
        {row("🎯", "Today", d.play)}
        {row("🚫", "Avoid", d.avoid, true)}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.35 }}>
        <strong>
          <Link href="/disclaimer" style={{ color: "inherit", textDecoration: "underline" }}>
            Disclaimer
          </Link>
          :
        </strong>{" "}
        Info only. Not for contraception or medical decisions. Not medical advice.
      </div>
    </section>
  );
}

const settingsRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  minHeight: 52,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid var(--input-border)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: 17,
  fontWeight: 700,
  textDecoration: "none",
};

function NavigateInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const day1Str = sp.get("day1") || "";
  // Values from the address are always forced into the allowed range (cycle 21-35 days, period 1-10 days),
  // so a typo or an old link can never break the phase maths.
  const bleedOverride = parseBleedDays(sp.get("bd"), DEFAULTS.bleedDays);
  const cycleLength = parseCycleLength(sp.get("cl"), DEFAULTS.cycleLength);

  // No date in the address (for example the app was opened on this page directly):
  // use the saved one, or send the user to the start screen.
  React.useEffect(() => {
    if (day1Str) return;
    const saved = loadSettings();
    router.replace(saved ? forecastUrl(saved) : "/");
  }, [day1Str, router]);

  // Remember the date and cycle settings on this phone every time they change.
  React.useEffect(() => {
    if (!day1Str) return;
    saveSettings({ day1: day1Str, cl: cycleLength, bd: bleedOverride });
  }, [day1Str, cycleLength, bleedOverride]);

  const [dismissBleedPrompt, setDismissBleedPrompt] = useState(false);
  const [tab, setTab] = useState<"today" | "month" | "settings">("today");

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
    return { date, dayIndex, phase, risk, headline: headlineFor(phase, dayIndex), ...c };
  };

  const current = useMemo(() => build(viewOffset), [viewOffset, bleedOverride, cycleLength]);

  const showBleedQuestion = !dismissBleedPrompt && current.dayIndex === bleedOverride + 1;
  const showNewPeriodQuestion = Number.isFinite(current.dayIndex) && current.dayIndex >= cycleLength;
  // A week past her usual cycle length counts as overdue
  const isOverdueBanner = current.dayIndex >= cycleLength + 7;

  const qpBase = `day1=${encodeURIComponent(day1Str)}&cl=${encodeURIComponent(String(cycleLength))}`;

  function extendBleedToCurrentDay() {
    // The period length is capped (see LIMITS). Past the cap, stop asking so the prompt can't loop.
    if (current.dayIndex > LIMITS.bleedDays.max) setDismissBleedPrompt(true);
    router.push(`/navigate?${qpBase}&bd=${encodeURIComponent(String(current.dayIndex))}`);
    router.refresh();
  }

  function setBleedToDay(day: number) {
    router.push(`/navigate?${qpBase}&bd=${encodeURIComponent(String(day))}`);
    router.refresh();
  }

  // `from` is the day the new cycle starts on. Default: the day being viewed (so swiping ahead to
  // Day 28+ and tapping "new cycle" starts it there). The Settings tab passes today.
  function startNewCycle(from: DayInfo = current) {
    const d = from.date;

    const newDay1Str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // Learn from the cycle that just ended, but only if it is a believable length.
    // A mistaken tap on day 8 must not teach the app that her cycle is 8 days long.
    // The next cycle uses her average of the last few cycles (blended with the length she stated at first).
    let nextCl = cycleLength;
    if (isRealCycleLength(from.dayIndex)) {
      nextCl = averageCycleLength(addCycleToHistory(from.dayIndex), cycleLength);
    }

    router.replace(`/navigate?day1=${encodeURIComponent(newDay1Str)}&bd=5&cl=${nextCl}`);
    router.refresh();
  }

  // --- Swipe handling (no libs) ---
  const drag = useRef({ active: false, startX: 0, dx: 0 });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchMode = useRef<"unknown" | "horizontal" | "vertical">("unknown");
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
    if (e?.pointerType === "touch") return;
    if (!drag.current.active) return;
    drag.current.active = false;

    const dx = drag.current.dx;

    if (dx <= -70) setDelta((v) => v + 1);
    else if (dx >= 70) setDelta((v) => Math.max(v - 1, -baseOffset));

    setDragPx(0);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMode.current = "unknown";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (touchMode.current === "unknown") {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (ax >= 10 || ay >= 10) {
        touchMode.current = ax > ay ? "horizontal" : "vertical";
      } else {
        return;
      }
    }

    if (touchMode.current === "horizontal") {
      setDragPx(dx);
      e.preventDefault();
    }
    // vertical: do nothing (native scroll)
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchMode.current === "horizontal") {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx <= -70) setDelta((v) => v + 1);
      else if (dx >= 70) setDelta((v) => Math.max(v - 1, -baseOffset));
      setDragPx(0);
    }
    touchMode.current = "unknown";
  };

  const onTouchCancel = () => {
    setDragPx(0);
    touchMode.current = "unknown";
  };

  const hardChatRange = useMemo(() => {
    const cycleLen = cycleLength;
    const ovCenter = Math.round(cycleLen / 2);
    const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
    const ovEnd = ovCenter + ovHalf;
    const startDay = (bleedOverride ?? DEFAULTS.bleedDays) + 1;
    const endDay = ovEnd;

    const startDate = addDays(day1, startDay - 1);
    const endDate = addDays(day1, endDay - 1);
    return { startDate, endDate, startDay, endDay };
  }, [day1, bleedOverride, cycleLength]);

  const quickDateRanges = useMemo(() => {
    const bleed = bleedOverride ?? DEFAULTS.bleedDays;
    const cycleLen = cycleLength ?? DEFAULTS.cycleLength;

    const ovCenter = Math.round(cycleLen / 2);
    const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
    const ovStart = ovCenter - ovHalf;
    const ovEnd = ovCenter + ovHalf;

    const pmsStart = cycleLen - DEFAULTS.pmsDays + 1;

    const talkStart = bleed + 1;
    const talkEnd = ovEnd;

    const worstTalkStart = pmsStart;
    const worstTalkEnd = cycleLen;

    const d = (dayNum: number) => addDays(day1, Math.max(0, dayNum - 1));

    return {
      talk: formatHumanDateRangeNoYear(d(talkStart), d(talkEnd)),
      worstTalk: formatHumanDateRangeNoYear(d(worstTalkStart), d(worstTalkEnd)),
      libido: formatHumanDateRangeNoYear(d(ovStart), d(ovEnd)),
      worstLibido: `${formatHumanDateRangeNoYear(d(1), d(bleed))}, ${formatHumanDateRangeNoYear(d(pmsStart), d(cycleLen))}`,
    };
  }, [day1, bleedOverride, cycleLength]);

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "18px auto",
        padding: "14px 14px 96px",
        fontFamily: "system-ui",
        color: "var(--foreground)",
        background: "var(--background)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 1000 as any, letterSpacing: -0.3 }}>Eggshells</div>
      </div>

      {tab === "month" && (
        <section style={{ marginTop: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>This cycle</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 12 }}>
            <div style={{ padding: 14, borderRadius: 12, background: "#F1FFF5", border: "1px solid #16A34A" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0B6B45", marginBottom: 4 }}>Best time to talk</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{quickDateRanges.talk}</div>
              <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Talk, plan, chill.</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: "#FFF1E8", border: "1px solid #EA580C" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#9A3412", marginBottom: 4 }}>Worst time for</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{quickDateRanges.worstTalk}</div>
              <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Heavy talks, pushing for answers, rows.</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: "#FFF7E6", border: "1px solid #F59E0B" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#7A4B00", marginBottom: 4 }}>Often more flirty</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{quickDateRanges.libido}</div>
              <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Still ask. A calendar can't say yes.</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: "#FFF1E8", border: "1px solid #EA580C" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#9A3412", marginBottom: 4 }}>Take it slow</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{quickDateRanges.worstLibido}</div>
              <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Intimacy may take a back seat. Don't push it.</div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: 14, borderRadius: 12, background: "#F1FFF5", border: "1px solid #16A34A" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0B6B45", marginBottom: 4 }}>Best time for the hard chat</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>
              {formatHumanDateRange(hardChatRange.startDate, hardChatRange.endDate)}{" "}
              <span style={{ color: "#444444", fontWeight: 700 }}>
                ({bestWorstRanges(bleedOverride, cycleLength).bestDays}, Follicular phase)
              </span>
            </div>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Settings</div>
          <Link href={`/?day1=${encodeURIComponent(day1Str)}&cl=${cycleLength}`} style={settingsRowStyle}>
            <span>Edit date &amp; cycle length</span>
            <span aria-hidden="true">›</span>
          </Link>
          <button type="button" onClick={() => startNewCycle(build(baseOffset))} style={{ ...settingsRowStyle, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
            <span>Her period started today</span>
            <span aria-hidden="true">›</span>
          </button>
          <Link href="/about" style={settingsRowStyle}>
            <span>About</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link href="/disclaimer" style={settingsRowStyle}>
            <span>Disclaimer</span>
            <span aria-hidden="true">›</span>
          </Link>
          <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Everything stays on this phone. Nothing is sent anywhere.
          </div>
        </section>
      )}

      {tab === "today" && (
      <>
      {showBleedQuestion && (
        <section style={{ marginTop: 12, borderRadius: 16, padding: 14, border: "1px solid var(--input-border)", background: "var(--background)", boxShadow: "0 1px 0 rgba(0,0,0,0.05)" }}>
          <div style={{ fontWeight: 1000 as any, color: "var(--foreground)" }}>Day {current.dayIndex}: still on?</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>Usually 5–7 days. Tell us when it's over so the phases line up.</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={extendBleedToCurrentDay} style={{ border: "1px solid var(--button-primary)", background: "var(--button-primary)", color: "var(--button-primary-color)", padding: "10px 12px", borderRadius: 12, fontWeight: 1000 as any, cursor: "pointer" }}>
              Still going
            </button>

            <button onClick={() => setDismissBleedPrompt(true)} style={{ border: "1px solid var(--input-border)", background: "var(--background)", color: "var(--foreground)", padding: "10px 12px", borderRadius: 12, fontWeight: 1000 as any, cursor: "pointer" }}>
              Over
            </button>
          </div>

          {current.dayIndex > 2 && (
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-secondary)" }}>
              Ended earlier — day{" "}
              <select value={bleedOverride} onChange={(e) => setBleedToDay(Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--input-border)", fontWeight: 700, cursor: "pointer" }}>
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

      {showNewPeriodQuestion && (
        <section style={{ marginTop: 12, borderRadius: 16, padding: 14, border: "1px solid #16A34A", background: "#F1FFF5", boxShadow: "0 1px 0 rgba(0,0,0,0.05)" }}>
          <div style={{ fontWeight: 1000 as any, color: "var(--foreground)" }}>{isOverdueBanner ? "Cycle overdue – ready to start a new one?" : `Day ${current.dayIndex}: new period?`}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            {isRealCycleLength(current.dayIndex)
              ? `Tap to start fresh. We'll learn from this cycle (${current.dayIndex} days) so the forecast adapts to her pattern.`
              : `Tap to start fresh. This one (${current.dayIndex} days) is outside the usual range, so it won't change her average.`}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={() => startNewCycle()} style={{ border: "1px solid var(--button-primary)", background: "var(--button-primary)", color: "var(--button-primary-color)", padding: "10px 12px", borderRadius: 12, fontWeight: 1000 as any, cursor: "pointer" }}>
              Yeah, new cycle
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>If not yet, swipe to another day.</div>
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
            touchAction: "pan-y",
            transform: `translateX(${dragPx}px)`,
            transition: drag.current.active ? "none" : "transform 160ms ease-out",
          }}
               >
          <DayCard d={current} />
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
            ◀ Prev day
          </button>

          <button
  onClick={() => setDelta((v) => v + 1)}
  style={{
    flex: 1,
    border: "1px solid var(--button-primary)",
    background: "linear-gradient(135deg, #16A34A, #22C55E)",
    color: "#ffffff",
    padding: "11px 12px",
    borderRadius: 14,
    fontWeight: 1000 as any,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(22,163,74,0.35)",
  }}
>
  Next day →
</button>
</div>

<div
  style={{
    marginTop: 18,
    fontSize: 11,
    color: "var(--text-secondary)",
    textAlign: "center",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  }}
>
  A <span style={{ fontWeight: 900, color: "var(--foreground)" }}>DAMS Labs</span> project
</div>
              </div>
      </>
      )}

      <nav
        aria-label="Main"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          background: "var(--background)",
          borderTop: "1px solid var(--input-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex" }}>
          {([
            ["today", "🧭", "Today"],
            ["month", "📅", "Month"],
            ["settings", "⚙️", "Settings"],
          ] as const).map(([key, emoji, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              style={{
                flex: 1,
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                border: "none",
                background: "transparent",
                color: tab === key ? "#15803D" : "var(--text-secondary)",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: tab === key ? 900 : 600,
                cursor: "pointer",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
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

