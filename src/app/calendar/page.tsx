"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";

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

function fmtShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

function phaseForDay(dayIndex: number): Phase {
  const { cycleLength, bleedDays, pmsDays, ovulationWindow } = DEFAULTS;
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

function daySummary(phase: Phase) {
  if (phase === "Menstrual") return "Comfort window; keep demands light.";
  if (phase === "Follicular") return "Stable window; good for plans/talks.";
  if (phase === "Ovulatory") return "Connection window; closeness often rises.";
  if (phase === "Luteal") return "More variable; keep things predictable.";
  return "High sensitivity window; avoid conflict spikes.";
}

export default function CalendarPage() {
  const sp = useSearchParams();
  const age = sp.get("age") || "";
  const day1Str = sp.get("day1") || "";

  const day1 = useMemo(() => {
    const d = new Date(day1Str + "T12:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [day1Str]);

  const days = useMemo(() => {
    if (!day1) return [];
    const out: { date: Date; dayIndex: number; phase: Phase; summary: string }[] = [];
    for (let i = 0; i < 31; i++) {
      const date = addDays(day1, i);
      const dayIndex = (i % DEFAULTS.cycleLength) + 1;
      const phase = phaseForDay(dayIndex);
      out.push({ date, dayIndex, phase, summary: daySummary(phase) });
    }
    return out;
  }, [day1]);

  if (!age || !day1) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
        <h1 style={{ marginTop: 0 }}>Monthly View</h1>
        <p style={{ color: "#444" }}>Missing inputs. Go back and enter age + Day 1.</p>
        <div style={{ marginTop: 10 }}>
          <Link href="/" style={{ fontSize: 14 }}>
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ marginTop: 0 }}>Monthly View</h1>

        <div style={{ display: "flex", gap: 14 }}>
          <Link
            href={`/navigate?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}`}
            style={{ fontSize: 14 }}
          >
            Today / Tomorrow
          </Link>

          <Link href="/" style={{ fontSize: 14 }}>
            Home
          </Link>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#444", marginBottom: 14 }}>
        Built on hormonal cycle patterns. Individual responses may differ. Real life always overrides predictions.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {days.map((d) => {
          const bg =
            d.phase === "Menstrual"
              ? "#f6f6ff"
              : d.phase === "Follicular"
              ? "#f6fff6"
              : d.phase === "Ovulatory"
              ? "#fffaf0"
              : d.phase === "Luteal"
              ? "#f7fbff"
              : "#fff6f6";

          return (
            <Link
              key={d.date.toISOString()}
              href={`/navigate?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1Str)}&date=${encodeURIComponent(
                d.date.toISOString().slice(0, 10)
              )}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #e6e6e6",
                borderRadius: 12,
                padding: 10,
                background: bg,
                minHeight: 86,
                display: "block",
              }}
              title={`${fmtShort(d.date)} — Day ${d.dayIndex} — ${d.phase}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#333" }}>
                <span>{fmtShort(d.date)}</span>
                <span style={{ color: "#666" }}>D{d.dayIndex}</span>
              </div>
              <div style={{ marginTop: 6, fontWeight: 700, fontSize: 12 }}>{d.phase}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#444", lineHeight: 1.25 }}>{d.summary}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
