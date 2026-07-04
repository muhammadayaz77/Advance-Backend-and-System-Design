import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin Turbopack root to this app so a parent-folder package-lock.json
// (e.g. under the user profile) is not mistaken for the workspace root.
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));
const twAnimateCss = path.join(
  turbopackRoot,
  "node_modules",
  "tw-animate-css",
  "dist",
  "tw-animate.css",
);

const nextConfig: NextConfig = {
  // Old onboarding URLs used `/performer`; the App Router segment is `/artist`.
  async redirects() {
    return [
      {
        source: "/dashboard/freelancer/performer",
        destination: "/dashboard/freelancer/artist",
        permanent: false,
      },
      {
        source: "/dashboard/freelancer/performer/:path*",
        destination: "/dashboard/freelancer/artist/:path*",
        permanent: false,
      },
    ];
  },
  // Dev: allow HMR / _next assets when the browser uses your LAN hostname (see terminal warning).
  allowedDevOrigins: ["192.168.1.35"],
  turbopack: {
    root: turbopackRoot,
    // Bare "tw-animate-css" is resolved from the repo root in the Tailwind CSS
    // pipeline on some setups; force the real file under this app's node_modules.
    resolveAlias: {
      "tw-animate-css": twAnimateCss,
    },
  },
};

export default nextConfig;
