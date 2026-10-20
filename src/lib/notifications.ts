// Daily heads-up notifications (native app only, opt-in).
// Scheduled locally on the device; nothing leaves the phone.
// We schedule a rolling 30-day window (iOS caps pending notifications at 64)
// and refresh it every time the forecast screen opens.

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { DEFAULTS, phaseForDay, riskFor, type Phase } from "@/lib/cycle";

export type CycleInput = { day1: string; cycleLength: number; bleedDays: number };

const STORAGE_KEY = "hmm_headsup_enabled";
const DAYS_AHEAD = 30;
const NOTIFY_HOUR = 9; // 09:00 local
const ID_BASE = 1000;

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function headsUpEnabled(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setEnabledFlag(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {}
}

const PHASE_TIP: Record<Phase, string> = {
  Menstrual: "Low energy. Keep plans easy and don't start anything heavy.",
  Follicular: "Good stretch. Talk, plan, get things done together.",
  Ovulatory: "Best days of the month. Social, upbeat, up for plans.",
  Luteal: "Patience thinning. Keep it simple and don't poke.",
  PMS: "Short fuse. No debates, no logic battles.",
};

function messageFor(dayIndex: number, c: CycleInput): { title: string; body: string } {
  const { cycleLength: cl, bleedDays: bd } = c;
  const pmsStart = cl - DEFAULTS.pmsDays + 1;
  const ovStart = Math.round(cl / 2) - Math.floor(DEFAULTS.ovulationWindow / 2);
  const phase = phaseForDay(dayIndex, bd, cl);
  const risk = riskFor(phase);

  if (dayIndex === pmsStart - 1)
    return { title: "Heads-up: PMS window starts tomorrow", body: "Next few days: short fuse likely. Sort anything important today." };
  if (dayIndex === pmsStart)
    return { title: "PMS window starts today", body: "Conflict risk high. Keep it short, skip the debates." };
  if (dayIndex === cl)
    return { title: "Her period is due tomorrow (estimate)", body: "Go easy. Update her start date in the app when it begins." };
  if (dayIndex === bd + 1)
    return { title: "Good stretch starts now", body: "Mood lifting. Best window for talking and planning." };
  if (dayIndex === ovStart)
    return { title: "Best few days start today", body: PHASE_TIP.Ovulatory };

  return { title: `Day ${dayIndex} · ${phase} · Conflict risk ${risk.toLowerCase()}`, body: PHASE_TIP[phase] };
}

async function cancelAll() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }
}

/** Replace all pending heads-ups with a fresh 30-day window for this cycle. */
export async function scheduleHeadsUps(c: CycleInput): Promise<void> {
  if (!isNativeApp()) return;
  const day1 = new Date(c.day1 + "T00:00:00");
  if (Number.isNaN(day1.getTime())) return;

  await cancelAll();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayIndex = Math.floor((todayStart.getTime() - day1.getTime()) / 86400000) + 1;
  const notifications = [];

  // Already past her expected cycle length: one nudge to update the date, nothing else.
  if (todayIndex > c.cycleLength) {
    const at = new Date(todayStart);
    at.setDate(at.getDate() + 1);
    at.setHours(NOTIFY_HOUR, 0, 0, 0);
    notifications.push({
      id: ID_BASE,
      title: "Has her new cycle started?",
      body: "Update her start date in Her Mood Map to keep the forecast accurate.",
      schedule: { at, allowWhileIdle: true },
      smallIcon: "ic_stat_notify",
    });
  } else {
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const at = new Date(todayStart);
      at.setDate(at.getDate() + i);
      at.setHours(NOTIFY_HOUR, 0, 0, 0);
      if (at.getTime() <= now.getTime()) continue;

      // Days past this cycle are projected onto the next one (estimate).
      const raw = todayIndex + i;
      const dayIndex = ((raw - 1) % c.cycleLength) + 1;
      const { title, body } = messageFor(dayIndex, c);
      notifications.push({
        id: ID_BASE + i,
        title,
        body,
        schedule: { at, allowWhileIdle: true },
        smallIcon: "ic_stat_notify",
      });
    }
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

/** Ask for permission and turn heads-ups on. Returns false if the user declined. */
export async function enableHeadsUps(c: CycleInput): Promise<boolean> {
  if (!isNativeApp()) return false;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return false;
  setEnabledFlag(true);
  await scheduleHeadsUps(c);
  return true;
}

export async function disableHeadsUps(): Promise<void> {
  setEnabledFlag(false);
  if (isNativeApp()) await cancelAll();
}
