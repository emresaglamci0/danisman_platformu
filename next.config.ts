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
  // Temel guvenlik basliklari. Icerik Guvenlik Politikasi (CSP) her istekte degistigi icin src/proxy.ts'te.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Site baska sitelerin icine gomulemez (tiklama tuzaklarina karsi)
          { key: "X-Frame-Options", value: "DENY" },
          // Tarayici dosya turunu tahmin etmeye calismaz
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS: site bir kez HTTPS ile acildiktan sonra tarayici 2 yil boyunca yalnizca HTTPS kullanir.
          // (HTTP uzerinden, ornegin localhost'ta, tarayicilar bu basligi yok sayar.)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Kullanmadigimiz cihaz ozelliklerini tamamen kapat
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
