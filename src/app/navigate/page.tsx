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

  play: string; // NEW: replaces Focus + Helps
  avoid: string;

  fertility: string;
};

const DEFAULTS = {
  cycleLength: 28,
  bleedDays: 7, // theoretical default
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

function pick(lines: string[], dayIndex: number, salt: number, viewSalt: number) {
  // deterministic daily variation + viewSalt (so adjacent days never repeat)
  const idx = (dayIndex * 7 + salt * 13 + viewSalt * 19) % lines.length;
  return lines[idx];
}

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

function riskFor(phase: Phase): RiskLevel {
  if (phase === "PMS") return "High";
  if (phase === "Menstrual") return "High";
  if (phase === "Luteal") return "Medium";
  return "Low";
}

function ovulationMeta(dayIndex: number) {
  const peak = Math.round(DEFAULTS.cycleLength / 2); // 14
  const fertileStart = peak - 2; // 12
  const fertileEnd = peak + 1; // 15
  return {
    peak,
    fertileStart,
    fertileEnd,
    isPeak: dayIndex === peak,
    inWindow: dayIndex >= fertileStart && dayIndex <= fertileEnd,
  };
}

function fertilityLine(dayIndex: number) {
  const { isPeak, inWindow } = ovulationMeta(dayIndex);
  if (isPeak) return "Highest odds today (best day in the 28-day model).";
  if (inWindow) return "High odds today (fertile window).";
  return "Lower odds today (relative to fertile window).";
}

function copyFor(phase: Phase, dayIndex: number, viewSalt: number) {
  // Tight, non-redundant: Mood / Libido / Stress / Communication / Play / Avoid
  if (phase === "Follicular") {
    return {
      mood: pick(
        ["More normal today. Less friction.", "Smoother day overall. Fewer landmines.", "More even day. Things land better."],
        dayIndex,
        11,
        viewSalt
      ),
      libido: pick(
        ["Interest is warming up.", "More spark than last week.", "Flirt energy is easier today."],
        dayIndex,
        12,
        viewSalt
      ),
      stress: pick(
        ["Small stuff is less likely to explode.", "Better buffer today.", "More tolerance for normal life."],
        dayIndex,
        14,
        viewSalt
      ),
      communication: pick(
        ["Keep it clear and simple.", "Say it straight. No essays.", "Be direct. Don’t overtalk."],
        dayIndex,
        15,
        viewSalt
      ),
      play: pick(
        ["Make plans and stick to them.", "Decide once and move on.", "Do the practical stuff today."],
        dayIndex,
        16,
        viewSalt
      ),
      avoid: pick(
        ["Picking at small issues.", "Starting unnecessary tension.", "Turning small stuff into a topic."],
        dayIndex,
        18,
        viewSalt
      ),
    };
  }

  if (phase === "Ovulatory") {
    return {
      mood: pick(
        ["More open today. Faster reactions.", "Higher engagement today.", "More responsive vibe today."],
        dayIndex,
        21,
        viewSalt
      ),
      libido: pick(
        ["Interest is clearly higher today.", "Signals are easier to read today.", "More obvious attraction day."],
        dayIndex,
        22,
        viewSalt
      ),
      stress: pick(
        ["Harder to annoy today (usually).", "Lower friction day.", "Less defensive than usual."],
        dayIndex,
        24,
        viewSalt
      ),
      communication: pick(
        ["Tone matters more than wording.", "Keep it confident and simple.", "Don’t overtalk."],
        dayIndex,
        25,
        viewSalt
      ),
      play: pick(
        ["Be present. That’s the whole move.", "Put in effort without trying too hard.", "Show up properly today."],
        dayIndex,
        26,
        viewSalt
      ),
      avoid: pick(
        ["Forcing escalation.", "Trying too hard.", "Making it heavy."],
        dayIndex,
        28,
        viewSalt
      ),
    };
  }

  if (phase === "Menstrual") {
    return {
      mood: pick(
        ["Tolerance is lower than usual today.", "Patience is limited today.", "Small things irritate faster today."],
        dayIndex,
        31,
        viewSalt
      ),
      libido: pick(
        ["Interest is basically off today.", "Low interest day.", "Not a sexual day."],
        dayIndex,
        32,
        viewSalt
      ),
      stress: pick(
        ["Little patience for friction.", "Stress builds quickly.", "Short fuse potential."],
        dayIndex,
        34,
        viewSalt
      ),
      communication: pick(
        ["Talk less if you don’t want an argument.", "Keep it short and factual.", "Not a discussion day."],
        dayIndex,
        35,
        viewSalt
      ),
      play: pick(
        ["Keep it contained. Handle essentials only.", "Do the basics and don’t create extra work.", "Keep the day simple and steady."],
        dayIndex,
        36,
        viewSalt
      ),
      avoid: pick(
        ["Opening issues you can’t finish today.", "Starting big talks.", "Pushing decisions."],
        dayIndex,
        38,
        viewSalt
      ),
    };
  }

  if (phase === "Luteal") {
    return {
      mood: pick(
        ["Less playful, more serious.", "More variable day.", "More easily annoyed day."],
        dayIndex,
        41,
        viewSalt
      ),
      libido: pick(
        ["More inconsistent than peak days.", "Still there, less central.", "More mood-dependent."],
        dayIndex,
        42,
        viewSalt
      ),
      stress: pick(
        ["Less tolerance for chaos.", "Irritation builds faster.", "More friction if you push."],
        dayIndex,
        44,
        viewSalt
      ),
      communication: pick(
        ["Be clear and specific.", "Say it once, cleanly.", "Avoid vague requests."],
        dayIndex,
        45,
        viewSalt
      ),
      play: pick(
        ["Keep plans stable and predictable.", "Lower the chaos. Keep it tidy.", "Do routine, not surprises."],
        dayIndex,
        46,
        viewSalt
      ),
      avoid: pick(
        ["Last-minute changes.", "‘We’ll see’ answers.", "Making things messy."],
        dayIndex,
        48,
        viewSalt
      ),
    };
  }

  // PMS
  return {
    mood: pick(
      ["Less margin for error.", "Reactions are sharper.", "More sensitive to tone."],
      dayIndex,
      51,
      viewSalt
    ),
    libido: pick(
      ["Low priority today.", "Not the focus.", "Inconsistent."],
      dayIndex,
      52,
      viewSalt
    ),
    stress: pick(
      ["Small things feel bigger.", "Escalates faster.", "Thin tolerance."],
      dayIndex,
      54,
      viewSalt
    ),
    communication: pick(
      ["Avoid debates.", "Do not correct.", "Less explaining, more listening."],
      dayIndex,
      55,
      viewSalt
    ),
    play: pick(
      ["Reduce friction. Keep it calm.", "Prevent damage. Keep it simple.", "Handle basics and don’t poke."],
      dayIndex,
      56,
      viewSalt
    ),
    avoid: pick(
      ["Arguments.", "Logic battles.", "Unnecessary confrontation."],
      dayIndex,
      58,
      viewSalt
    ),
  };
}

function PhaseChip({ phase }: { phase: Phase }) {
  const m: Record<Phase, { bg: string; border: string; emoji: string }> = {
    Menstrual: { bg: "#FFF1F5", border: "#FF3B7B", emoji: "🩸" },
    Follicular: { bg: "#F1FFF5", border: "#16A34A", emoji: "🌱" },
    Ovulatory: { bg: "#FFF7E6", border: "#F59E0B", emoji: "🔥" },
    Luteal: { bg: "#EEF7FF", border: "#2563EB", emoji: "🧠" },
    PMS: { bg: "#FFECEC", border: "#EF4444", emoji: "⚡" },
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
        background: "#fff",
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      <span aria-hidden="true">{s.emoji}</span>
      {phase}
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
      Risk: {risk}
    </span>
  );
}

function DayCard({ d }: { d: DayInfo }) {
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
      <div style={{ width: 24, textAlign: "center", fontSize: 16 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.2, color: "#111" }}>{label}</div>
        <div style={{ fontSize: 15, lineHeight: 1.35, color: "#111", marginTop: 2 }}>{value}</div>
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
          {fmt(d.date)} <span style={{ color: "#666", fontSize: 13 }}>· Day {d.dayIndex}</span>
        </div>
        <div style={{ color: "#666", fontSize: 12 }}>Swipe ◀ ▶</div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <PhaseChip phase={d.phase} />
        <RiskChip risk={d.risk} />
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {row("🙂", "Mood", d.mood)}
        {row("🔥", "Libido", d.libido)}
        {row("🧯", "Stress", d.stress)}
        {row("💬", "Communication", d.communication)}
        {row("▶️", "Play", d.play)}
        {row("🚫", "Avoid", d.avoid)}
        {row("🤰", "Pregnancy odds", d.fertility)}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "#444", lineHeight: 1.35 }}>
        Pattern-based. Individual responses may differ.
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

  const [dismissBleedPrompt, setDismissBleedPrompt] = useState(false);

  const day1 = useMemo(() => new Date(day1Str + "T12:00:00"), [day1Str]);
  const today = useMemo(() => new Date(), []);

  const baseOffset = useMemo(() => {
    const a = startOfDay(today).getTime();
    const b = startOfDay(day1).getTime();
    return Math.max(0, Math.floor((a - b) / 86400000));
  }, [today, day1]);

  // swipeable offset (0 = today)
  const [delta, setDelta] = useState(0);

  const viewOffset = baseOffset + delta;

  const build = (o: number, viewSalt: number): DayInfo => {
    const date = addDays(day1, o);
    const dayIndex = o + 1;
    const phase = phaseForDay(dayIndex, bleedOverride);
    const risk = riskFor(phase);
    const c = copyFor(phase, dayIndex, viewSalt);
    const fertility = fertilityLine(dayIndex);
    return { date, dayIndex, phase, risk, fertility, ...c };
  };

  const current = useMemo(() => build(viewOffset, delta + 100), [viewOffset, delta, bleedOverride]); // viewSalt shifts with delta

  // Day 8 prompt: period theoretically over (7 days); ask if still going
  const showBleedQuestion = !dismissBleedPrompt && current.dayIndex === (DEFAULTS.bleedDays + 1);

  const qpBase = `age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}`;

  function extendBleedToCurrentDay() {
    router.push(`/navigate?${qpBase}&bd=${encodeURIComponent(String(current.dayIndex))}`);
  }

  // --- Swipe handling (no libs) ---
  const drag = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    dx: 0,
  });

  const [dragPx, setDragPx] = useState(0);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current.active = true;
    drag.current.startX = e.clientX;
    drag.current.lastX = e.clientX;
    drag.current.dx = 0;
    setDragPx(0);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const x = e.clientX;
    const dx = x - drag.current.startX;
    drag.current.lastX = x;
    drag.current.dx = dx;
    setDragPx(dx);
  };

  const onPointerUp = () => {
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

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "18px auto",
        padding: 14,
        fontFamily: "system-ui",
        color: "#111",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 1000 as any, letterSpacing: -0.2 }}>Day View 🧭</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href={`/calendar?${qpBase}`} style={{ fontSize: 13, textDecoration: "none", fontWeight: 900 }}>
            📅 Month
          </Link>
          <Link href="/" style={{ fontSize: 13, textDecoration: "none", fontWeight: 900 }}>
            🏠 Home
          </Link>
        </div>
      </div>

      {showBleedQuestion && (
        <section
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 14,
            border: "1px solid #ddd",
            background: "#fff",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontWeight: 1000 as any }}>🩸 Day {current.dayIndex}: period still going?</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
            Default assumption is ~7 days. Some people bleed longer.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button
              onClick={extendBleedToCurrentDay}
              style={{
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              ✅ Yes (extend)
            </button>

            <button
              onClick={() => setDismissBleedPrompt(true)}
              style={{
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 1000 as any,
                cursor: "pointer",
              }}
            >
              ❌ No
            </button>
          </div>
        </section>
      )}

      <div style={{ marginTop: 14 }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            touchAction: "pan-y",
            transform: `translateX(${dragPx}px)`,
            transition: drag.current.active ? "none" : "transform 160ms ease-out",
          }}
        >
          <DayCard d={current} />
        </div>

        {/* tiny controls as backup (still phone-friendly) */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
          <button
            onClick={() => setDelta((v) => Math.max(v - 1, -baseOffset))}
            style={{
              flex: 1,
              border: "1px solid #ddd",
              background: "#fff",
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
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
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
