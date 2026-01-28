# All Changes Discussed (List First, Apply Later)

## 1. Already done (from earlier)
- [x] Rename Mood Forecast → Cycle Forecast everywhere
- [x] Remove "Worst day for pregnancy" card; fix "Best day for" → "Best day for conversations" (subtext: Conversations, planning, hanging out.)
- [x] Add `router.refresh()` after `router.push(...)` in `extendBleedToCurrentDay()` so forecast updates when user clicks "No, still going"
- [x] Mobile swipe: `touchAction: "none"` + touch handlers (`onTouchStart` / `onTouchMove` / `onTouchEnd` / `onTouchCancel`) with 70px threshold; skip pointer handling when `pointerType === "touch"`

---

## 2. Abnormal periods – app should adjust

- [x] **Cycle length (cl):** Add URL param `cl` (e.g. 21–35, default 28). Use it in `phaseForDay`, `ovulationMeta`, `bestWorstRanges` instead of hardcoded `DEFAULTS.cycleLength` so ovulation/PMS scale (e.g. 35-day → ovulation ~17–18).
- [x] **Home page:** Add "Her typical cycle length (days)" (21–35, default 28). Pass `cl` to `/navigate`. Optional: "Her typical period length (days)" and pass initial `bd`.
- [x] **Navigate:** Read `cl` from search params; optional "It ended earlier" to set `bd` to a lower day (period ended on day X).
- [x] **Copy:** Add line: "If her cycle is usually longer or shorter than 28 days, set her cycle length for a better estimate."
- [x] **Framing:** All copy for man entering partner's info: "her cycle," "her typical…," "she says it's over / still going" where relevant.

---

## 3. Unique forecast per day – no repeat

- [x] **Stable per day:** Remove `viewSalt` from forecast; same `dayIndex` (and phase) always shows the same text.
- [x] **Unique 6-tuple per day:** Assign `forecastId = (dayIndex * 97) % 729`, decode to 6 indices (mood, libido, stress, communication, play, avoid) so each day gets a different full forecast. Use these indices to pick from existing 3-line arrays (no `pick()` randomness from viewSalt).

---

## 4. Copy tone – appealing to men, not offensive, not soft

- [x] **Keep:** Direct 70/80/90s male talk – "Short fuse," "Not a sex day," "Leave it alone," "No debates," "No logic battles," "Keep it short or you'll get an argument." Punchy, blunt, practical.
- [x] **Avoid only:** Actually offensive words – "crazy," "bitchy," "hormonal" (as insult), "nagging," "drama queen." Don't over-sanitize into soft/vague language.
- [x] **No change needed** – current copy already fits; no offensive terms found. Tone kept direct.

---

## Summary checklist (to apply)

| # | Area | Action |
|---|------|--------|
| 2a | URL + logic | Add `cl` param; use in phaseForDay, ovulationMeta, bestWorstRanges |
| 2b | Home | "Her typical cycle length (days)" 21–35, default 28; pass `cl` (and optional `bd`) |
| 2c | Navigate | Read `cl`; optional "It ended earlier" to set `bd` |
| 2d | Copy | One line about setting cycle length for non-28-day cycles; "her" framing |
| 3 | Forecast | Unique forecast per day: drop viewSalt, forecastId + 6 indices per dayIndex |
| 4 | Copy tone | Audit only; remove truly offensive terms, keep direct male tone |
