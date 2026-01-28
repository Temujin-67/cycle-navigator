"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [day1, setDay1] = useState("");

  function go() {
    if (!age || !day1) return;
    router.push(`/navigate?age=${encodeURIComponent(age)}&day1=${encodeURIComponent(day1)}`);
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
        First day of cycle
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
    </main>
  );
}
