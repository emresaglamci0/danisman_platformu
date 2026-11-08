"use client";

import "./globals.css";
import { AcilDurumBandi, AcilDurumSeridi } from "@/components/AcilDurumBandi";
import HataSayfasi from "./error";

// Ana cerceve (layout.tsx) bozulunca onun yerine gecer; her sayfada olmasi gereken uyarilar bu yuzden burada da var.
export default function GenelHataSayfasi({ retry }: { retry: () => void }) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <title>Bir sorun oluştu</title>
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
          <strong>Demo:</strong> Bu site bir portfolyo projesidir. Gerçek bilgilerinizi girmeyin.
        </div>
        <AcilDurumSeridi />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
          <HataSayfasi retry={retry} />
        </main>
        <AcilDurumBandi />
      </body>
    </html>
  );
}
