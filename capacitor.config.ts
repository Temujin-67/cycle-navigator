// FYM_FILE_UPDATED: 2026-02-01T06:00:00Z
// -------------------------------------------------------
// capacitor.config.ts
// Capacitor wrapper config for static Next export (/out)
// -------------------------------------------------------

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.damsstudio.hermoodmap",
  appName: "Cycle Forecast",
  webDir: "out",
  bundledWebRuntime: false,
};

export default config;
