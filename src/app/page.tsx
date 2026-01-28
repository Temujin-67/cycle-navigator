"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_BLEED_DAYS = 5;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function HomePage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [day1, setDay1] = useState("");
  const [cycleLength, setCycleLength] = useState(String(DEFAULT_CYCLE_LENGTH));
  const [showPeriodStillOn, setShowPeriodStillOn] = useState(false);

  const day1InPast = (): boolean => {
    if (!day1) return false;
    const day1Start = new Date(day1 + "T00:00:00");
    const todayStart = startOfDay(new Date());
    return day1Start.getTime() < todayStart.getTime();
  };

  const daysAgo = (): number => {
    if (!day1) return 0;
    const day1Start = new Date(day1 + "T00:00:00");
    const todayStart = startOfDay(new Date());
    return Math.floor((todayStart.getTime() - day1Start.getTime()) / 86400000);
  };

  const todayDayIndex = (): number => daysAgo() + 1;

  function go() {
    if (!age || !day1) return;
    const cl = Math.min(35, Math.max(21, Number(cycleLength) || DEFAULT_CYCLE_LENGTH));
    if (day1InPast()) {
      setShowPeriodStillOn(true);
      return;
    }
    navigate(cl, DEFAULT_BLEED_DAYS);
  }

  function navigate(cl: number, bd: number) {
    if (!age || !day1) return;
    router.push(
      `/navigate?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1)}&cl=${cl}&bd=${bd}`
    );
  }

  function confirmPeriodStillOn() {
    const cl = Math.min(35, Math.max(21, Number(cycleLength) || DEFAULT_CYCLE_LENGTH));
    const bd = todayDayIndex();
    setShowPeriodStillOn(false);
    navigate(cl, bd);
  }

  function confirmPeriodOver() {
    const cl = Math.min(35, Math.max(21, Number(cycleLength) || DEFAULT_CYCLE_LENGTH));
    setShowPeriodStillOn(false);
    navigate(cl, DEFAULT_BLEED_DAYS);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        maxWidth: 420,
        margin: "0 auto",
        padding: "2.5rem 1.25rem",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        background: "linear-gradient(180deg, #f0fdf4 0%, var(--background) 40%)",
        color: "var(--foreground)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Cycle Forecast
        </h1>
        <ThemeToggle />
      </div>

      <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: "1.5rem" }}>
        Hormonal cycle patterns. Fewer arguments, better relationship. Individual responses differ.
      </p>

      <label style={{ display: "block", marginTop: "1.25rem", fontSize: "0.9375rem", fontWeight: 600 }}>
        Partner age
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 0.875rem",
            marginTop: "0.375rem",
            fontSize: "1rem",
            border: "1px solid var(--input-border)",
            borderRadius: 10,
            background: "var(--input-bg)",
            color: "var(--foreground)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--input-focus-border)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(22, 163, 74, 0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </label>

      <label style={{ display: "block", marginTop: "1.25rem", fontSize: "0.9375rem", fontWeight: 600 }}>
        First day of her cycle (DD MM YYYY)
        <input
          type="date"
          value={day1}
          onChange={(e) => setDay1(e.target.value)}
          aria-label="First day of her cycle — tap to open calendar"
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            marginTop: "0.5rem",
            fontSize: "1rem",
            minHeight: "48px",
            border: "2px solid var(--input-border)",
            borderRadius: 10,
            background: "var(--input-bg)",
            color: "var(--foreground)",
            outline: "none",
            display: "block",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--input-focus-border)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(22, 163, 74, 0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.375rem", display: "block" }}>
          Tap the box above to open the calendar and pick the date.
        </span>
      </label>

      <label style={{ display: "block", marginTop: "1.25rem", fontSize: "0.9375rem", fontWeight: 600 }}>
        Her typical cycle length (days) — optional
        <input
          type="number"
          min={21}
          max={35}
          value={cycleLength}
          onChange={(e) => setCycleLength(e.target.value)}
          placeholder="28"
          style={{
            width: "100%",
            padding: "0.75rem 0.875rem",
            marginTop: "0.375rem",
            fontSize: "1rem",
            border: "1px solid var(--input-border)",
            borderRadius: 10,
            background: "var(--input-bg)",
            color: "var(--foreground)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--input-focus-border)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(22, 163, 74, 0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
          Leave at 28 if unsure. We&apos;ll learn it when she has her next period.
        </span>
      </label>

      <button
        onClick={go}
        style={{
          marginTop: "2rem",
          width: "100%",
          padding: "0.875rem 1.25rem",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          borderRadius: 10,
          background: "var(--button-primary)",
          color: "var(--button-primary-color)",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--button-primary-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--button-primary)";
        }}
      >
        Continue
      </button>

      {showPeriodStillOn && (
        <section
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: 12,
            border: "1px solid var(--input-border)",
            background: "var(--input-bg)",
          }}
        >
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            That date was {daysAgo()} day{daysAgo() !== 1 ? "s" : ""} ago. Is her period still going?
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
            We assume it&apos;s over after 5 days unless you tell us otherwise. If it&apos;s still on, we&apos;ll show today as Menstrual phase.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={confirmPeriodStillOn}
              style={{
                padding: "0.5rem 1rem",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--button-primary)",
                borderRadius: 10,
                background: "var(--button-primary)",
                color: "var(--button-primary-color)",
              }}
            >
              Yes, still on
            </button>
            <button
              type="button"
              onClick={confirmPeriodOver}
              style={{
                padding: "0.5rem 1rem",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--input-border)",
                borderRadius: 10,
                background: "var(--background)",
                color: "var(--foreground)",
              }}
            >
              No, it&apos;s over
            </button>
          </div>
        </section>
      )}

      <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
        <strong>Disclaimer:</strong> For informational use only. Not for contraception or medical decisions. Not medical advice. Consult a healthcare provider for health decisions. <Link href="/disclaimer" style={{ fontWeight: 600, textDecoration: "underline" }}>Full disclaimer &amp; terms</Link>
      </p>
    </main>
  );
}
