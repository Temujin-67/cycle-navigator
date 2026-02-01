// CHANGED LINES:
// - output: "export" to generate a static bundle in /out for Capacitor
// - trailingSlash: true to avoid routing issues in WebView (static export)

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
