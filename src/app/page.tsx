"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [day1, setDay1] = useState("");

  function go() {
    if (!age || !day1) return;
    router.push(`/navigate?age=${age}&day1=${day1}`);
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Cycle Navigator</h1>

      <p style={{ fontSize: 14, color: "#444" }}>
        Built on hormonal cycle patterns. Individual responses may differ.
      </p>

      <label style={{ display: "block", marginTop: 20 }}>
        Partner age
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 20 }}>
        First day of cycle
        <input
          type="date"
          value={day1}
          onChange={(e) => setDay1(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <button
        onClick={go}
        style={{
          marginTop: 30,
          width: "100%",
          padding: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Continue
      </button>
    </main>
  );
}
