"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";

type Settings = {
  cycleLength: number; // 21..40 (internal only; not a UI input)
  bleedDays: number;
  pmsDays: number;
  ovulationWindow: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function getSettings(sp: ReturnType<typeof useSearchParams>): Settings {
  const cl = clamp(parseIntSafe(sp.get("cl"), 28), 21, 40);
  return {
    cycleLength: cl,
    bleedDays: 5,
    pmsDays: 5,
    ovulationWindow: 3,
  };
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(12, 0, 0, 0);
  return x;
}

function fmtShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

function phaseForDay(dayIndex: number, s: Settings): Phase {
  const { cycleLength, bleedDays, pmsDays, ovulationWindow } = s;

  const ovCenter = Math.round(cycleLength / 2);
  const ovHalf = Math.floor(ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;

  const pmsStart = cycleLength - pmsDays + 1;

  if (dayIndex >= 1 && dayIndex <= bleedDays) return "Menstrual";
  if (dayIndex >= ovStart && dayIndex <= ovEnd) return "Ovulatory";
  if (dayIndex >= pmsStart) return "PMS";
  if (dayIndex > ovEnd && dayIndex < pmsStart) return "Luteal";
  return "Follicular";
}

/**
 * Deterministic daily microcopy:
 * - changes every day (based on dayIndex)
 * - no randomness (SSR/hydration-safe)
 * - playful but not offensive
 */
function daySummary(phase: Phase, dayIndex: number) {
  const bank: Record<Phase, string[]> = {
    Menstrual: [
      "Soft mode today. Comfort > productivity.",
      "Gentle day. Keep plans light and kindness high.",
      "Low-pressure vibes. Think cosy, not complicated.",
      "Small asks, big appreciation. That’s the move.",
      "Keep it simple: warmth, space, and snacks (if available).",
    ],
    Follicular: [
      "Green-light energy. Good day for plans and chats.",
      "Clearer headspace often shows up here — use it well.",
      "Momentum day. Keep things upbeat and practical.",
      "Good window for teamwork: calm, direct, friendly.",
      "More “let’s do it” vibes — pick one nice plan.",
    ],
    Ovulatory: [
      "Connection boost day. Flirt level: easier than usual.",
      "Social sparkle window. Compliments land well.",
      "Closeness tends to rise here — keep it playful.",
      "High “together” energy. Romantic points are cheaper today.",
      "Warm vibe day. Be present, be sweet, don’t overthink.",
    ],
    Luteal: [
      "Steady-but-sensitive zone. Predictable wins.",
      "Keep it structured: fewer surprises, smoother day.",
      "A bit more reactive sometimes — lead with calm.",
      "Clarity > debate. Simple communication works best.",
      "Do the basics well: reassurance, patience, consistency.",
    ],
    PMS: [
      "High sensitivity day. Choose peace over point-scoring.",
      "Tiny annoyances can feel louder — keep it gentle.",
      "Not the day for “serious talks”. Be kind, be brief.",
      "Low friction strategy: warmth + zero sarcasm.",
      "Protect the vibe: support first, logic later.",
    ],
  };

  const lines = bank[phase];
  // dayIndex starts at 1, so shift to keep day 1 deterministic and not always the first line
  const idx = (dayIndex * 3 + 1) % lines.length;
  return lines[idx];
}

function phaseMeta(phase: Phase) {
  // Stronger colour accents + emoji
  const meta: Record<
    Phase,
    {
      label: string;
      emoji: string;
      bg: string;
      border: string;
      pillBg: string;
      pillFg: string;
    }
  > = {
    Menstrual: {
      label: "Menstrual",
      emoji: "🩸",
      bg: "linear-gradient(180deg, #FFF3F7 0%, #FFFFFF 100%)",
      border: "#FF4D7D",
      pillBg: "#FFE0EA",
      pillFg: "#9B1035",
    },
    Follicular: {
      label: "Follicular",
      emoji: "🌱",
      bg: "linear-gradient(180deg, #F1FFF5 0%, #FFFFFF 100%)",
      border: "#19C37D",
      pillBg: "#DFFBEA",
      pillFg: "#0B6B45",
    },
    Ovulatory: {
      label: "Ovulatory",
      emoji: "✨",
      bg: "linear-gradient(180deg, #FFF7E6 0%, #FFFFFF 100%)",
      border: "#FFB020",
      pillBg: "#FFEBC2",
      pillFg: "#7A4B00",
    },
    Luteal: {
      label: "Luteal",
      emoji: "🧠",
      bg: "linear-gradient(180deg, #EEF7FF 0%, #FFFFFF 100%)",
      border: "#1E88E5",
      pillBg: "#D8ECFF",
      pillFg: "#0B4A84",
    },
    PMS: {
      label: "PMS",
      emoji: "⚡",
      bg: "linear-gradient(180deg, #FFEFF1 0%, #FFFFFF 100%)",
      border: "#FF3B30",
      pillBg: "#FFD6D3",
      pillFg: "#7F1D1D",
    },
  };

  return meta[phase];
}

export default function CalendarClient() {
  const sp = useSearchParams();
  const age = sp.get("age") || "";
  const day1Str = sp.get("day1") || "";
  const s = useMemo(() => getSettings(sp), [sp]);

  const day1 = useMemo(() => {
    const d = new Date(day1Str + "T12:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [day1Str]);

  const days = useMemo(() => {
    if (!day1) return [];
    const out: { date: Date; dayIndex: number; phase: Phase; summary: string }[] = [];
    for (let i = 0; i < 31; i++) {
      const date = addDays(day1, i);
      const dayIndex = (i % s.cycleLength) + 1;
      const phase = phaseForDay(dayIndex, s);
      out.push({ date, dayIndex, phase, summary: daySummary(phase, dayIndex) });
    }
    return out;
  }, [day1, s]);

  const qp = `age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}&cl=${encodeURIComponent(
    String(s.cycleLength)
  )}`;

  if (!age || !day1) {
    return (
      <main
        style={{
          maxWidth: 720,
          margin: "40px auto",
          padding: 20,
          fontFamily: "system-ui",
          color: "#111",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 26 }}>Monthly View 📅</h1>
        <p style={{ color: "#444", lineHeight: 1.5 }}>
          Missing inputs. Go back and enter <b>partner age</b> + <b>Day 1</b>.
        </p>
        <div style={{ marginTop: 12 }}>
          <Link href="/" style={{ fontSize: 14, textDecoration: "underline" }}>
            ← Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "28px auto",
        padding: 18,
        fontFamily: "system-ui",
        color: "#111",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6, fontSize: 28, letterSpacing: -0.2 }}>Monthly View 📅</h1>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.4 }}>
            Pattern-based (not predictive). <b>Individual responses may differ.</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href={`/navigate?${qp}`}
            style={{
              fontSize: 14,
              textDecoration: "none",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 100%)",
              color: "#111",
              fontWeight: 600,
            }}
          >
            Today / Tomorrow →
          </Link>

          <Link
            href="/"
            style={{
              fontSize: 14,
              textDecoration: "none",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#111",
            }}
          >
            Home
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 14,
          marginBottom: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        {(["Menstrual", "Follicular", "Ovulatory", "Luteal", "PMS"] as Phase[]).map((p) => {
          const m = phaseMeta(p);
          return (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 999,
                background: m.pillBg,
                color: m.pillFg,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${m.border}`,
              }}
              title={`${m.label} phase`}
            >
              <span aria-hidden="true">{m.emoji}</span>
              <span>{m.label}</span>
            </span>
          );
        })}
        <span style={{ fontSize: 12, color: "#666" }}>Tap a day to open the Day view.</span>
      </div>

      {/* Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {days.map((d) => {
          const m = phaseMeta(d.phase);

          return (
            <Link
              key={d.date.toISOString()}
              href={`/navigate?${qp}&date=${encodeURIComponent(d.date.toISOString().slice(0, 10))}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 16,
                padding: 12,
                background: m.bg,
                minHeight: 94,
                display: "block",
                border: "1px solid #eee",
                boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                position: "relative",
                overflow: "hidden",
              }}
              title={`${fmtShort(d.date)} — Day ${d.dayIndex} — ${d.phase}`}
            >
              {/* Accent stripe */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 6,
                  background: m.border,
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#333" }}>
                <span style={{ paddingLeft: 6 }}>{fmtShort(d.date)}</span>
                <span style={{ color: "#666", fontWeight: 700 }}>D{d.dayIndex}</span>
              </div>

              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, paddingLeft: 6 }}>
                <span aria-hidden="true" style={{ fontSize: 14 }}>
                  {m.emoji}
                </span>
                <span style={{ fontWeight: 800, fontSize: 12 }}>{d.phase}</span>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#333", lineHeight: 1.25, paddingLeft: 6 }}>
                {d.summary}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer disclaimer */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#555", lineHeight: 1.45 }}>
        Built on hormonal cycle patterns (education-only). Individual responses may differ. Real life always overrides
        predictions.
      </div>
    </main>
  );
}
