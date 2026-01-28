"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
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
  energy: string;
  stress: string;
  communication: string;
  focus: string;
  helps: string;
  avoid: string;
  fertility: string; // NEW: “best day to get pregnant” style line
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

function pick(lines: string[], dayIndex: number, salt: number, labelSalt: number) {
  // Deterministic variation: dayIndex + field salt + label salt (TODAY/TOMORROW)
  const idx = (dayIndex * 7 + salt * 13 + labelSalt * 19) % lines.length;
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
  // Default 28-day model: ovulation “peak” day ~14, fertile window ~12–15
  const peak = Math.round(DEFAULTS.cycleLength / 2); // 14
  const fertileStart = peak - 2; // 12
  const fertileEnd = peak + 1; // 15
  return { peak, fertileStart, fertileEnd, isPeak: dayIndex === peak, inWindow: dayIndex >= fertileStart && dayIndex <= fertileEnd };
}

function fertilityLine(dayIndex: number, phase: Phase) {
  const { isPeak, inWindow } = ovulationMeta(dayIndex);
  if (phase !== "Ovulatory" && !inWindow) return "Lower odds today (relative to fertile window).";
  if (isPeak) return "Highest odds today (best day to get pregnant in the 28-day model).";
  if (inWindow) return "High odds today (fertile window).";
  return "Lower odds today (relative to fertile window).";
}

function copyFor(phase: Phase, dayIndex: number, labelSalt: number) {
  // NOTE: Each field is a bank → deterministic variation prevents TODAY/TOMORROW repeats.
  if (phase === "Follicular") {
    return {
      mood: pick(
        ["More normal today. Less friction.", "Smoother day overall. Less drama potential.", "More even day. Things land better."],
        dayIndex,
        11,
        labelSalt
      ),
      libido: pick(
        ["Interest is warming up.", "More spark than last week.", "Odds are better for flirt energy."],
        dayIndex,
        12,
        labelSalt
      ),
      energy: pick(
        ["More energy for plans and people.", "More capacity to do things.", "Better drive today."],
        dayIndex,
        13,
        labelSalt
      ),
      stress: pick(
        ["Better buffer — fewer blow-ups.", "Small stuff is less likely to explode.", "More tolerance for normal life."],
        dayIndex,
        14,
        labelSalt
      ),
      communication: pick(
        ["Say it straight. It lands better.", "Be direct. Don’t overtalk.", "Keep it clear and simple."],
        dayIndex,
        15,
        labelSalt
      ),
      focus: pick(
        ["Good day to get stuff sorted.", "Good day to plan and execute.", "Easy day to handle logistics."],
        dayIndex,
        16,
        labelSalt
      ),
      helps: pick(
        ["Make plans and stick to them.", "Pick the plan. Do the plan.", "Follow through without theatre."],
        dayIndex,
        17,
        labelSalt
      ),
      avoid: pick(
        ["Picking at small issues.", "Turning small stuff into a topic.", "Starting unnecessary tension."],
        dayIndex,
        18,
        labelSalt
      ),
    };
  }

  if (phase === "Ovulatory") {
    return {
      mood: pick(
        ["More open today. Faster reactions.", "Higher engagement today.", "More responsive vibe today."],
        dayIndex,
        21,
        labelSalt
      ),
      libido: pick(
        ["Interest is clearer today.", "Signals are easier to read today.", "More obvious attraction day."],
        dayIndex,
        22,
        labelSalt
      ),
      energy: pick(
        ["More social energy today.", "Higher output day.", "More drive for interaction."],
        dayIndex,
        23,
        labelSalt
      ),
      stress: pick(
        ["Harder to annoy today (usually).", "Less defensive than usual.", "Lower friction day."],
        dayIndex,
        24,
        labelSalt
      ),
      communication: pick(
        ["Tone > words.", "Keep it confident and simple.", "Don’t overtalk."],
        dayIndex,
        25,
        labelSalt
      ),
      focus: pick(
        ["Connection is easier today.", "Momentum comes easier.", "Good day to reconnect."],
        dayIndex,
        26,
        labelSalt
      ),
      helps: pick(
        ["Show up. Be present.", "Keep it natural. No ‘moves’.", "Small effort, bigger return."],
        dayIndex,
        27,
        labelSalt
      ),
      avoid: pick(
        ["Forcing escalation.", "Trying too hard.", "Making it heavy."],
        dayIndex,
        28,
        labelSalt
      ),
    };
  }

  if (phase === "Menstrual") {
    return {
      mood: pick(
        ["Tolerance is lower than usual today.", "Patience is limited today.", "Small things irritate faster today."],
        dayIndex,
        31,
        labelSalt
      ),
      libido: pick(
        ["Interest is basically off today.", "Low interest day.", "Not a sexual day."],
        dayIndex,
        32,
        labelSalt
      ),
      energy: pick(
        ["Energy is low and runs out quickly.", "Low energy day.", "Fatigue shows up faster."],
        dayIndex,
        33,
        labelSalt
      ),
      stress: pick(
        ["Little patience.", "Short fuse potential.", "Stress builds quickly."],
        dayIndex,
        34,
        labelSalt
      ),
      communication: pick(
        ["Talk less if you don’t want an argument.", "Keep it short and factual.", "Not a discussion day."],
        dayIndex,
        35,
        labelSalt
      ),
      focus: pick(
        ["Don’t escalate.", "Keep things contained.", "Avoid pushing anything forward."],
        dayIndex,
        36,
        labelSalt
      ),
      helps: pick(
        ["Stick to essentials. Everything else can wait.", "Handle basics and move on.", "Keep the day simple."],
        dayIndex,
        37,
        labelSalt
      ),
      avoid: pick(
        ["Opening issues you can’t finish today.", "Starting big talks.", "Pushing decisions."],
        dayIndex,
        38,
        labelSalt
      ),
    };
  }

  if (phase === "Luteal") {
    return {
      mood: pick(
        ["Less playful, more serious.", "More variable day.", "More easily annoyed day."],
        dayIndex,
        41,
        labelSalt
      ),
      libido: pick(
        ["Still there, less central.", "More inconsistent than peak days.", "More mood-dependent."],
        dayIndex,
        42,
        labelSalt
      ),
      energy: pick(
        ["Steady, not peak.", "Slower pace works better.", "Less appetite for extra plans."],
        dayIndex,
        43,
        labelSalt
      ),
      stress: pick(
        ["Irritation builds faster.", "Less tolerance for chaos.", "More friction if you push."],
        dayIndex,
        44,
        labelSalt
      ),
      communication: pick(
        ["Be clear and specific.", "Say it once, cleanly.", "Avoid vague requests."],
        dayIndex,
        45,
        labelSalt
      ),
      focus: pick(
        ["Predictability wins.", "Routine beats surprises.", "Keep plans stable."],
        dayIndex,
        46,
        labelSalt
      ),
      helps: pick(
        ["Plan early. Stick to it.", "Keep the day organised.", "Lower the chaos."],
        dayIndex,
        47,
        labelSalt
      ),
      avoid: pick(
        ["Last-minute changes.", "‘We’ll see’ answers.", "Making things messy."],
        dayIndex,
        48,
        labelSalt
      ),
    };
  }

  // PMS
  return {
    mood: pick(
      ["Reactions are sharper.", "Less margin for error.", "More sensitivity to tone."],
      dayIndex,
      51,
      labelSalt
    ),
    libido: pick(
      ["Low priority today.", "Not the focus.", "Inconsistent."],
      dayIndex,
      52,
      labelSalt
    ),
    energy: pick(
      ["Lower output day.", "Energy dips are common.", "Battery drains quicker."],
      dayIndex,
      53,
      labelSalt
    ),
    stress: pick(
      ["Small things feel bigger.", "Escalates faster.", "Thin tolerance."],
      dayIndex,
      54,
      labelSalt
    ),
    communication: pick(
      ["Less explaining, more listening.", "Avoid debates.", "Do not correct."],
      dayIndex,
      55,
      labelSalt
    ),
    focus: pick(
      ["Reduce friction.", "Prevent damage.", "Keep it contained."],
      dayIndex,
      56,
      labelSalt
    ),
    helps: pick(
      ["Make life easier, not bigger.", "Keep it simple.", "Lower the noise."],
      dayIndex,
      57,
      labelSalt
    ),
    avoid: pick(
      ["Arguments.", "Logic battles.", "Unnecessary confrontation."],
      dayIndex,
      58,
      labelSalt
    ),
  };
}

function Card({
  title,
  d,
}: {
  title: string;
  d: DayInfo;
}) {
  const phaseStyles: Record<Phase, { bg: string; border: string; emoji: string }> = {
    Menstrual: { bg: "#FFF1F5", border: "#FF3B7B", emoji: "🩸" },
    Follicular: { bg: "#F1FFF5", border: "#16A34A", emoji: "🌱" },
    Ovulatory: { bg: "#FFF7E6", border: "#F59E0B", emoji: "🔥" },
    Luteal: { bg: "#EEF7FF", border: "#2563EB", emoji: "🧠" },
    PMS: { bg: "#FFECEC", border: "#EF4444", emoji: "⚡" },
  };

  const riskStyles: Record<RiskLevel, { bg: string; fg: string; emoji: string }> = {
    Low: { bg: "#E8FFF1", fg: "#0B6B45", emoji: "🟢" },
    Medium: { bg: "#FFF6E5", fg: "#7A4B00", emoji: "🟠" },
    High: { bg: "#FFECEC", fg: "#7F1D1D", emoji: "🔴" },
  };

  const ps = phaseStyles[d.phase];
  const rs = riskStyles[d.risk];

  const row = (emoji: string, label: string, value: string) => (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 22, textAlign: "center" }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.2 }}>{label}</div>
        <div style={{ fontSize: 14, lineHeight: 1.35, color: "#111" }}>{value}</div>
      </div>
    </div>
  );

  return (
    <section
      style={{
        border: `1px solid ${ps.border}`,
        background: ps.bg,
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div style={{ fontWeight: 900, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#444" }}>{fmt(d.date)}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <span
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${ps.border}`,
            background: "#fff",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <span aria-hidden="true">{ps.emoji}</span>
          Day {d.dayIndex} — {d.phase}
        </span>

        <span
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.08)",
            background: rs.bg,
            color: rs.fg,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          <span aria-hidden="true">{rs.emoji}</span>
          Risk: {d.risk}
        </span>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {row("🙂", "Mood", d.mood)}
        {row("🔥", "Libido", d.libido)}
        {row("⚡", "Energy", d.energy)}
        {row("🧯", "Stress", d.stress)}
        {row("💬", "Communication", d.communication)}
        {row("🎯", "Focus", d.focus)}
        {row("✅", "Helps", d.helps)}
        {row("🚫", "Avoid", d.avoid)}
        {row("🤰", "Pregnancy odds", d.fertility)}
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

  const offset = useMemo(() => {
    const a = startOfDay(today).getTime();
    const b = startOfDay(day1).getTime();
    return Math.max(0, Math.floor((a - b) / 86400000));
  }, [today, day1]);

  const build = (o: number, labelSalt: number): DayInfo => {
    const date = addDays(day1, o);
    const dayIndex = o + 1;
    const phase = phaseForDay(dayIndex, bleedOverride);
    const risk = riskFor(phase);
    const c = copyFor(phase, dayIndex, labelSalt);
    const fertility = fertilityLine(dayIndex, phase);
    return { date, dayIndex, phase, risk, fertility, ...c };
  };

  const todayInfo = build(offset, 1);
  const tomorrowInfo = build(offset + 1, 2);

  // Day 8 prompt: period theoretically over (7 days); ask if still going
  const showBleedQuestion = !dismissBleedPrompt && todayInfo.dayIndex === (DEFAULTS.bleedDays + 1);

  const qpBase = `age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}`;

  function extendBleedToToday() {
    // Set bd to today dayIndex, so menstrual phase extends
    router.push(`/navigate?${qpBase}&bd=${encodeURIComponent(String(todayInfo.dayIndex))}`);
  }

  function keepDefaultBleed() {
    setDismissBleedPrompt(true);
  }

  return (
    <main style={{ maxWidth: 980, margin: "28px auto", padding: 16, fontFamily: "system-ui", color: "#111" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.2 }}>Day View 🧭</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href={`/calendar?${qpBase}`} style={{ fontSize: 13, textDecoration: "none", fontWeight: 800 }}>
            📅 Month
          </Link>
          <Link href="/" style={{ fontSize: 13, textDecoration: "none", fontWeight: 800 }}>
            🏠 Home
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#444", lineHeight: 1.4 }}>
        Educational pattern-based view. Individual responses may differ.
      </div>

      {showBleedQuestion && (
        <section
          style={{
            marginTop: 14,
            borderRadius: 16,
            padding: 14,
            border: "1px solid #ddd",
            background: "#fff",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontWeight: 900 }}>🩸 Day {todayInfo.dayIndex}: period still going?</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
            The default assumption is ~7 days. Some people bleed longer.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button
              onClick={extendBleedToToday}
              style={{
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ✅ Yes (extend)
            </button>

            <button
              onClick={keepDefaultBleed}
              style={{
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ❌ No
            </button>
          </div>
        </section>
      )}

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <Card title="TODAY" d={todayInfo} />
        <Card title="TOMORROW" d={tomorrowInfo} />
      </div>

      <style>{`
        @media (max-width: 780px) {
          main > div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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

