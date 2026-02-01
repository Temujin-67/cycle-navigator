// CHANGED LINES:
// - Added: periodEndDate (yyyy-mm-dd) + showPeriodOverDateQuestion (new prompt when day1 is in the past)
// - go(): past-date flow now asks "is it over?" THEN asks for end date if over
// - Added: daysBetweenYMD(), periodEndMin(), periodEndMax() helpers for safe bounds
// - navigate(): passes bd based on (periodEndDate - day1 + 1) when provided
// - Home copy: expanded explanation (what the app is / how to use / not deterministic)
// - Removed unused state: showPeriodStillOn (replaced by showPeriodOverDateQuestion flow)

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_BLEED_DAYS = 5;
const ONBOARDING_KEY = "cf_onboarding_done";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetweenYMD(aYmd: string, bYmd: string): number {
  // a -> b, in whole days
  const a = new Date(aYmd + "T00:00:00");
  const b = new Date(bYmd + "T00:00:00");
  const a0 = startOfDay(a).getTime();
  const b0 = startOfDay(b).getTime();
  if (Number.isNaN(a0) || Number.isNaN(b0)) return 0;
  return Math.floor((b0 - a0) / 86400000);
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [age, setAge] = useState("");
  const [day1, setDay1] = useState("");

  // Past-date flow
  const [showPeriodEndQuestion, setShowPeriodEndQuestion] = useState(false);
  const [showPeriodOverDateQuestion, setShowPeriodOverDateQuestion] = useState(false);
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [periodEndDay, setPeriodEndDay] = useState(DEFAULT_BLEED_DAYS);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingDay1, setOnboardingDay1] = useState("");
  const [onboardingAge, setOnboardingAge] = useState("");

  useEffect(() => {
    const qDay1 = searchParams.get("day1");
    const qAge = searchParams.get("age");
    if (qDay1) setDay1(qDay1);
    if (qAge != null) setAge(qAge);
  }, [searchParams]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        setOnboardingDay1(formatDateInput(twoWeeksAgo));
      }
    } catch {
      setShowOnboarding(false);
    }
  }, []);

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

  function periodEndMin(): string {
    // earliest end date is day1
    return day1 || formatDateInput(new Date());
  }

  function periodEndMax(): string {
    // latest end date is today
    return formatDateInput(new Date());
  }

  function go() {
    if (!day1) return;

    // Reset any previous prompts when user hits Go again
    setShowPeriodEndQuestion(false);
    setShowPeriodOverDateQuestion(false);

    if (day1InPast()) {
      // New required flow:
      // ask if period is over; if yes, ask for end date; if no, mark today as in-period
      setShowPeriodOverDateQuestion(true);
      return;
    }

    navigate(DEFAULT_CYCLE_LENGTH, DEFAULT_BLEED_DAYS);
  }

  function navigate(cl: number, bd: number) {
    if (!day1) return;
    const a = age || "";
    router.push(`/navigate?age=${encodeURIComponent(a)}&day1=${encodeURIComponent(day1)}&cl=${cl}&bd=${bd}`);
  }

  function finishOnboarding() {
    if (!onboardingDay1) return;
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {}
    setShowOnboarding(false);
    router.push(
      `/navigate?age=${encodeURIComponent(onboardingAge)}&day1=${encodeURIComponent(onboardingDay1)}&cl=${DEFAULT_CYCLE_LENGTH}&bd=${DEFAULT_BLEED_DAYS}`
    );
  }

  function confirmPeriodStillOn() {
    // Still on today -> bleed days must cover "today"
    const bd = todayDayIndex();
    setShowPeriodOverDateQuestion(false);
    navigate(DEFAULT_CYCLE_LENGTH, bd);
  }

  function confirmPeriodOver() {
    // Ask for end DATE (not "end day")
    setShowPeriodOverDateQuestion(false);

    const todayYmd = formatDateInput(new Date());
    // default end date: day1 + 4 days (5-day bleed), clamped to today
    const guess = new Date(day1 + "T12:00:00");
    guess.setDate(guess.getDate() + (DEFAULT_BLEED_DAYS - 1));
    const guessYmd = formatDateInput(guess);

    const start = periodEndMin();
    const end = todayYmd;

    const defaultEnd = guessYmd < start ? start : guessYmd > end ? end : guessYmd;

    setPeriodEndDate(defaultEnd);
    setShowPeriodEndQuestion(true);
  }

  function confirmPeriodEndDate() {
    if (!day1) return;
    if (!periodEndDate) return;

    // bd = number of days from day1 to end date, inclusive
    const diff = daysBetweenYMD(day1, periodEndDate);
    const bd = Math.max(1, diff + 1);

    setShowPeriodEndQuestion(false);
    navigate(DEFAULT_CYCLE_LENGTH, bd);
  }

  function confirmPeriodEndDay() {
    // legacy path still supported (kept minimal-delta), but no longer used by the new flow
    setShowPeriodEndQuestion(false);
    navigate(DEFAULT_CYCLE_LENGTH, periodEndDay);
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
      {showOnboarding && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "var(--background)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: 380 }}>
            {onboardingStep === 1 && (
              <>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>First day of her last period</h2>
                <input
                  type="date"
                  value={onboardingDay1}
                  onChange={(e) => setOnboardingDay1(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    marginBottom: "1rem",
                    fontSize: "1rem",
                    border: "2px solid var(--input-border)",
                    borderRadius: 10,
                    background: "var(--input-bg)",
                    color: "var(--foreground)",
                  }}
                />
                <label style={{ display: "block", fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Her age (optional)
                </label>
                <input
                  type="number"
                  value={onboardingAge}
                  onChange={(e) => setOnboardingAge(e.target.value)}
                  placeholder=""
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.875rem",
                    marginBottom: "1rem",
                    fontSize: "1rem",
                    border: "1px solid var(--input-border)",
                    borderRadius: 10,
                    background: "var(--input-bg)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1.25rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 10,
                    background: "var(--button-primary)",
                    color: "var(--button-primary-color)",
                  }}
                >
                  Next
                </button>
              </>
            )}
            {onboardingStep === 2 && (
              <>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>You&apos;re set</h2>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  All data stays on your device. No accounts, no sharing.
                </p>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1.25rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 10,
                    background: "var(--button-primary)",
                    color: "var(--button-primary-color)",
                  }}
                >
                  See today&apos;s forecast
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Cycle Forecast</h1>
      </div>

      <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
        A simple day-by-day read of the cycle using general hormonal patterns — to time conversations, reduce friction, and understand what “today” might feel like.
        <br />
        <span style={{ fontWeight: 700 }}>Not a predictor.</span> People vary. Real life overrides the pattern.
      </p>

      <label style={{ display: "block", marginTop: "1.25rem", fontSize: "0.9375rem", fontWeight: 600 }}>
        First day of her last period
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
        Her age (optional)
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
        Go
      </button>

      {showPeriodOverDateQuestion && (
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
            That was {daysAgo()} day{daysAgo() !== 1 ? "s" : ""} ago. Is the period over?
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
            If it&apos;s still on, we&apos;ll count today as period. If it&apos;s over, we&apos;ll ask the end date so phases line up.
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
              Still going
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
              Over
            </button>
          </div>
        </section>
      )}

      {showPeriodEndQuestion && (
        <section
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: 12,
            border: "1px solid var(--input-border)",
            background: "var(--input-bg)",
          }}
        >
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.5rem" }}>When did her period end?</div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
            Pick the last day she was bleeding. (We only use this to align the phase windows.)
          </p>

          <input
            type="date"
            value={periodEndDate}
            min={periodEndMin()}
            max={periodEndMax()}
            onChange={(e) => setPeriodEndDate(e.target.value)}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              marginBottom: "0.75rem",
              fontSize: "1rem",
              border: "2px solid var(--input-border)",
              borderRadius: 10,
              background: "var(--input-bg)",
              color: "var(--foreground)",
            }}
          />

          <button
            type="button"
            onClick={confirmPeriodEndDate}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              borderRadius: 10,
              background: "var(--button-primary)",
              color: "var(--button-primary-color)",
            }}
          >
            Continue
          </button>

          {/* legacy selector (kept for safety, hidden) */}
          <div style={{ display: "none" }}>
            <select value={periodEndDay} onChange={(e) => setPeriodEndDay(Number(e.target.value))}>
              {Array.from({ length: Math.max(1, Math.min(7, todayDayIndex())) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button type="button" onClick={confirmPeriodEndDay}>
              Continue legacy
            </button>
          </div>
        </section>
      )}

      <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
        <strong>Disclaimer:</strong> Info only. Not for contraception or medical decisions. Not medical advice.{" "}
        <Link href="/disclaimer" style={{ fontWeight: 600, textDecoration: "underline" }}>
          Full disclaimer &amp; terms
        </Link>
      </p>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
          Loading…
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

