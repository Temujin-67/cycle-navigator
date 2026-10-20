// On-device settings for Eggshells.
// Everything is stored in the phone's own storage. Nothing is sent anywhere.
// The functions are kept simple and synchronous so the storage backend can be
// swapped for Capacitor Preferences later without touching the pages.

export type Settings = {
  /** First day of her last period, as YYYY-MM-DD */
  day1: string;
  /** Her typical cycle length in days */
  cl: number;
  /** Her period length in days */
  bd: number;
};

const KEY = "eg_settings_v1";

export const LIMITS = {
  cycleLength: { min: 21, max: 35 },
  bleedDays: { min: 1, max: 10 },
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_BLEED_DAYS = 5;

function toNumberOrNaN(v: unknown): number {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "string" && v.trim() === "") return NaN;
  return Number(v);
}

/** Turns any value (URL text, typed input, saved data) into a cycle length within the limits. */
export function parseCycleLength(v: unknown, fallback: number = DEFAULT_CYCLE_LENGTH): number {
  const n = toNumberOrNaN(v);
  if (!Number.isFinite(n)) return fallback;
  return clamp(Math.round(n), LIMITS.cycleLength.min, LIMITS.cycleLength.max);
}

/** Turns any value into a period length within the limits. */
export function parseBleedDays(v: unknown, fallback: number = DEFAULT_BLEED_DAYS): number {
  const n = toNumberOrNaN(v);
  if (!Number.isFinite(n)) return fallback;
  return clamp(Math.round(n), LIMITS.bleedDays.min, LIMITS.bleedDays.max);
}

function isValidDateString(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  if (Number.isNaN(d.getTime())) return false;
  // Reject dates that roll over (e.g. 2026-02-31)
  const [y, m, day] = s.split("-").map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

/** Returns clean settings, or null if the input is not usable. */
export function sanitize(input: { day1?: unknown; cl?: unknown; bd?: unknown }): Settings | null {
  if (!isValidDateString(input.day1)) return null;
  const cl = Number(input.cl);
  const bd = Number(input.bd);
  if (!Number.isFinite(cl) || !Number.isFinite(bd)) return null;
  return {
    day1: input.day1,
    cl: clamp(Math.round(cl), LIMITS.cycleLength.min, LIMITS.cycleLength.max),
    bd: clamp(Math.round(bd), LIMITS.bleedDays.min, LIMITS.bleedDays.max),
  };
}

export function loadSettings(): Settings | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSettings(s: { day1?: unknown; cl?: unknown; bd?: unknown }): void {
  try {
    if (typeof window === "undefined") return;
    const clean = sanitize(s);
    if (!clean) return;
    window.localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // Storage can be unavailable (private mode, full disk). The app still works, it just won't remember.
  }
}

export function clearSettings(): void {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Builds the forecast URL for a set of settings. */
export function forecastUrl(s: Settings): string {
  return `/navigate?day1=${encodeURIComponent(s.day1)}&cl=${s.cl}&bd=${s.bd}`;
}
