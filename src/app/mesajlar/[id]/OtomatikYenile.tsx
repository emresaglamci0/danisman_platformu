"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Yeni mesajlari gormek icin sayfayi 10 saniyede bir sessizce yeniler.
// Sekme arka plandayken yenilemez.
export function OtomatikYenile() {
  const router = useRouter();

  useEffect(() => {
    const zamanlayici = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 10_000);
    return () => clearInterval(zamanlayici);
  }, [router]);

  return null;
}
