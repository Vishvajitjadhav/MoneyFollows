import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf ships native-ish font/layout code; keep it out of the server bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  // The PDF route reads Inter from disk — make sure the files are deployed with it.
  outputFileTracingIncludes: {
    "/api/reports/pdf": ["./lib/pdf/fonts/**"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
