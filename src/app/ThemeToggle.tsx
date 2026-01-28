"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = (typeof document !== "undefined" && (document.documentElement.getAttribute("data-theme") as "light" | "dark")) || "light";
    setTheme(t === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("cf_theme", next);
    } catch (_) {}
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        border: "1px solid var(--input-border)",
        borderRadius: 8,
        background: "var(--input-bg)",
        color: "var(--foreground)",
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
