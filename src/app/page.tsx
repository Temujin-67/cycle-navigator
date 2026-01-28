"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_BLEED_DAYS = 5;

export default function HomePage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [day1, setDay1] = useState("");
  const [cycleLength, setCycleLength] = useState(String(DEFAULT_CYCLE_LENGTH));
  const [bleedDays, setBleedDays] = useState(String(DEFAULT_BLEED_DAYS));

  function go() {
    if (!age || !day1) return;
    const cl = Math.min(35, Math.max(21, Number(cycleLength) || DEFAULT_CYCLE_LENGTH));
    const bd = Math.min(10, Math.max(3, Number(bleedDays) || DEFAULT_BLEED_DAYS));
    router.push(
      `/navigate?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1)}&cl=${cl}&bd=${bd}`
    );
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
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
        Cycle Forecast
      </h1>

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
        First day of her cycle
        <input
          type="date"
          value={day1}
          onChange={(e) => setDay1(e.target.value)}
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

      <label style={{ display: "block", marginTop: "1.25rem", fontSize: "0.9375rem", fontWeight: 600 }}>
        Her typical period length (days)
        <input
          type="number"
          min={3}
          max={10}
          value={bleedDays}
          onChange={(e) => setBleedDays(e.target.value)}
          placeholder="5"
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
        Continue
      </button>

      <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
        <strong>Disclaimer:</strong> For informational use only. Not for contraception or medical decisions. Not medical advice. Consult a healthcare provider for health decisions.
      </p>
    </main>
  );
}
