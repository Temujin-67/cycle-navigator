// -------------------------------------------------------
// capacitor.config.ts
// Capacitor wrapper config for static Next export (/out)
// appId is final: com.damsstudios.hermoodmap on both stores.
// It cannot be changed after the first store upload.
// -------------------------------------------------------

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.damsstudios.hermoodmap",
  appName: "Her Mood Map",
  webDir: "out",
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notify",
      iconColor: "#16A34A",
    },
  },
};

export default config;
