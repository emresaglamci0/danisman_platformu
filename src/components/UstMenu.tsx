"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cikisYap } from "@/app/giris/islemler";
import type { Rol } from "@/lib/sabitler";

const YENILEME_SURESI = 30_000;

function Sayac({ adet }: { adet: number }) {
  if (adet === 0) return null;
  return (
    <span className="ml-1 rounded-full bg-teal-700 px-1.5 py-0.5 text-xs font-semibold text-white">
      {adet > 99 ? "99+" : adet}
      <span className="sr-only"> yeni</span>
    </span>
  );
}

export function UstMenu({ rol, ogrenciAcik }: { rol: Rol | null; ogrenciAcik: boolean }) {
  const yol = usePathname();
  const [acik, setAcik] = useState(false);
  const [sayilar, setSayilar] = useState({ mesaj: 0, panel: 0 });
  const bildirimli = rol !== null && rol !== "admin";

  // Ust menu sayfa degisince yeniden olusmaz; sayaclar sayfa gecisinde ve 30 saniyede bir yenilenir.
  useEffect(() => {
    if (!bildirimli) return;
    const yenile = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/bildirimler")
        .then((yanit) => (yanit.ok ? yanit.json() : null))
        .then((veri) => veri && setSayilar(veri))
        .catch(() => {}); // Sayac alinamazsa eski deger kalir; sayfa kullanimi etkilenmez
    };
    yenile();
    const zamanlayici = setInterval(yenile, YENILEME_SURESI);
    return () => clearInterval(zamanlayici);
  }, [bildirimli, yol]);

  const kapat = () => setAcik(false);
  const baglanti = "text-sm hover:text-teal-800";

  return (
    <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
      <Link href="/" onClick={kapat} className="font-baslik text-xl font-semibold text-teal-800">
        Danışman Buluşma
      </Link>

      <button
        type="button"
        aria-expanded={acik}
        aria-controls="ana-menu"
        onClick={() => setAcik(!acik)}
        className="relative cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium lg:hidden"
      >
        {acik ? "Kapat" : "Menü"}
        {!acik && <Sayac adet={sayilar.mesaj + sayilar.panel} />}
      </button>

      <div
        id="ana-menu"
        className={`${acik ? "flex" : "hidden"} w-full flex-col gap-3 lg:flex lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:gap-6`}
      >
        <Link href="/uzmanlar" onClick={kapat} className={baglanti}>
          Uzmanlar
        </Link>
        {ogrenciAcik && (
          <Link href="/ogrenci-uzmanlar" onClick={kapat} className={baglanti}>
            Öğrenci Uzmanlar
          </Link>
        )}
        <Link href="/on-gorusme" onClick={kapat} className={baglanti}>
          Ücretsiz Ön Görüşme
        </Link>
        <Link href="/grup-seanslari" onClick={kapat} className={baglanti}>
          Grup Seansları
        </Link>
        <Link href="/psikolojik-rahatsizliklar" onClick={kapat} className={baglanti}>
          Psikolojik Rahatsızlıklar
        </Link>
        {rol && (
          <Link href="/mesajlar" onClick={kapat} className={baglanti}>
            Mesajlar
            <Sayac adet={sayilar.mesaj} />
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm lg:ml-auto">
          {rol ? (
            <>
              {rol === "admin" && (
                <Link href="/admin" onClick={kapat} className="font-medium text-teal-800 hover:underline">
                  Yönetim
                </Link>
              )}
              <Link href="/panel" onClick={kapat} className="hover:text-teal-800">
                Panelim
                <Sayac adet={sayilar.panel} />
              </Link>
              <form action={cikisYap}>
                <button className="cursor-pointer text-slate-600 hover:text-slate-900">Çıkış</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/giris" onClick={kapat} className="hover:text-teal-800">
                Giriş
              </Link>
              <Link
                href="/kayit"
                onClick={kapat}
                className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800"
              >
                Kayıt ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
