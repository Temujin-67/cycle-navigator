"use client";

// UI glue for daily heads-up notifications: a menu toggle (native app only)
// and a hook that refreshes the scheduled window whenever the cycle changes.

import React, { useEffect, useState } from "react";
import {
  disableHeadsUps,
  enableHeadsUps,
  headsUpEnabled,
  isNativeApp,
  scheduleHeadsUps,
  type CycleInput,
} from "@/lib/notifications";

export function useSyncHeadsUps(c: CycleInput) {
  useEffect(() => {
    if (!c.day1 || !isNativeApp() || !headsUpEnabled()) return;
    scheduleHeadsUps(c).catch(() => {});
  }, [c.day1, c.cycleLength, c.bleedDays]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function DailyHeadsUpMenuItem({ cycle, onDone }: { cycle: CycleInput; onDone: () => void }) {
  const [native, setNative] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNative(isNativeApp());
    setOn(headsUpEnabled());
  }, []);

  if (!native) return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (on) {
        await disableHeadsUps();
        setOn(false);
      } else {
        const ok = await enableHeadsUps(cycle);
        setOn(ok);
        if (!ok) window.alert("Notifications are blocked. Turn them on for Her Mood Map in your phone's Settings.");
      }
    } catch {
      // Leave state as-is on failure.
    } finally {
      setBusy(false);
      onDone();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      style={{
        display: "block",
        width: "100%",
        padding: "10px 14px",
        textAlign: "left",
        border: "none",
        background: "transparent",
        color: "var(--foreground)",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {on ? "Daily Heads-Up: On" : "Daily Heads-Up: Off"}
    </button>
  );
}
