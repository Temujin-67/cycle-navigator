// Shared cycle math used by the forecast UI and by scheduled notifications,
// so both always agree on phase and conflict risk for a given day.

export type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" | "PMS";
export type RiskLevel = "Low" | "Medium" | "High";

export const DEFAULTS = {
  cycleLength: 28,
  bleedDays: 5, // check from Day 6 (5-day period possible)
  pmsDays: 5,
  ovulationWindow: 3,
};

export function phaseForDay(
  dayIndex: number,
  bleedOverride?: number,
  cycleLengthOverride?: number
): Phase {
  const bleed = bleedOverride ?? DEFAULTS.bleedDays;
  const cycleLength = cycleLengthOverride ?? DEFAULTS.cycleLength;

  const ovCenter = Math.round(cycleLength / 2);
  const ovHalf = Math.floor(DEFAULTS.ovulationWindow / 2);
  const ovStart = ovCenter - ovHalf;
  const ovEnd = ovCenter + ovHalf;

  const pmsStart = cycleLength - DEFAULTS.pmsDays + 1;

  if (dayIndex <= bleed) return "Menstrual";
  if (dayIndex >= ovStart && dayIndex <= ovEnd) return "Ovulatory";
  if (dayIndex >= pmsStart) return "PMS";
  if (dayIndex > ovEnd && dayIndex < pmsStart) return "Luteal";
  return "Follicular";
}

export function riskFor(phase: Phase): RiskLevel {
  if (phase === "PMS") return "High";
  if (phase === "Menstrual") return "High";
  if (phase === "Luteal") return "Medium";
  return "Low";
}
