import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Belge yuklemeleri (en fazla 5 MB) icin form boyut siniri; varsayilan 1 MB
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Temel guvenlik basliklari: sitenin baska sitelerin icine gomulmesini engeller vb.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
