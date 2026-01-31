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

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [age, setAge] = useState("");
  const [day1, setDay1] = useState("");
  const [showPeriodStillOn, setShowPeriodStillOn] = useState(false);
  const [showPeriodEndQuestion, setShowPeriodEndQuestion] = useState(false);
  const [periodEndDay, setPeriodEndDay] = useState(DEFAULT_BLEED_DAYS);
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
    setShowPeriodStillOn(false);
    setShowPeriodEndQuestion(false);
  }, [day1]);

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

  function go() {
    if (!day1) return;
    if (day1InPast()) {
      setShowPeriodEndQuestion(false);
      setShowPeriodStillOn(true);
      return;
    }
    setShowPeriodStillOn(false);
    setShowPeriodEndQuestion(false);
    navigate(DEFAULT_CYCLE_LENGTH, DEFAULT_BLEED_DAYS);
  }

  function navigate(cl: number, bd: number) {
    if (!day1) return;
    const a = age || "";
    router.push(
      `/navigate?age=${encodeURIComponent(a)}&day1=${encodeURIComponent(day1)}&cl=${cl}&bd=${bd}`
    );
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
    const bd = todayDayIndex();
    setShowPeriodStillOn(false);
    setShowPeriodEndQuestion(false);
    navigate(DEFAULT_CYCLE_LENGTH, bd);
  }

  function confirmPeriodOver() {
    setShowPeriodStillOn(false);
    const maxSelectable = Math.max(1, Math.min(7, daysAgo()));
    setPeriodEndDay(Math.min(DEFAULT_BLEED_DAYS, maxSelectable));
    setShowPeriodEndQuestion(true);
  }

  function confirmPeriodEndDay() {
    const maxSelectable = Math.max(1, Math.min(7, daysAgo()));
    const safeDay = Math.min(Math.max(1, periodEndDay), maxSelectable);
    setShowPeriodEndQuestion(false);
    navigate(DEFAULT_CYCLE_LENGTH, safeDay);
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
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Cycle Forecast
        </h1>
      </div>

      <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: "1.5rem" }}>
        Track the cycle. Fewer arguments, better days.
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
            That was {daysAgo()} day{daysAgo() !== 1 ? "s" : ""} ago. Still on?
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
            If it&apos;s still on, we&apos;ll mark today as period.
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
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            When did her period end?
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
            Pick the day of her cycle it ended (Day 1 = first day of period).
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Ended on day</label>
            <select
              value={periodEndDay}
              onChange={(e) => setPeriodEndDay(Number(e.target.value))}
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "1rem",
                border: "1px solid var(--input-border)",
                borderRadius: 10,
                background: "var(--input-bg)",
                color: "var(--foreground)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {Array.from({ length: Math.min(7, daysAgo()) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={confirmPeriodEndDay}
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
        </section>
      )}

      <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
        <strong>Disclaimer:</strong> Info only. Not for contraception or medical decisions. Not medical advice. <Link href="/disclaimer" style={{ fontWeight: 600, textDecoration: "underline" }}>Full disclaimer &amp; terms</Link>
      </p>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>Loading…</div>}>
      <HomePageContent />
    </Suspense>
  );
}
