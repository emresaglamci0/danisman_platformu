"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { OnayGerekir } from "@/components/OnayGerekir";
import { ACIL_HATLAR } from "@/lib/acil-hatlar";
import { GIRIS, MADDELER, YANITLAR } from "./maddeler";
import type { Alan } from "@/lib/sabitler";
import { degerlendir, uzmanlariSec, type Sonuc, type UzmanOzeti, type Yanit } from "./puanlama";

type Adim = "davet" | number | "sonuc";
type Secim = ReturnType<typeof uzmanlariSec>;

const ANAHTAR = "olcek-davet-goruldu";
const BIRINCIL = "rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800";
const IKINCIL = "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

// Yanitlar ve sonuc yalnizca bu bilesenin hafizasinda durur; hicbir yere gonderilmez/yazilmaz.
export function OlcekPenceresi({
  uzmanlar,
  kartlar,
  davetiBastir = false,
}: {
  uzmanlar: UzmanOzeti[];
  kartlar: Record<string, ReactNode>;
  // Bekleyen uzman degerlendirmesi varken davet kendiliginden acilmaz ve "goruldu" yazilmaz.
  davetiBastir?: boolean;
}) {
  const pencere = useRef<HTMLDialogElement>(null);
  const odakHedefi = useRef<HTMLElement | null>(null);
  // Davet bir kez islendiyse (otomatik acildi ya da dugmeyle baslandi) kendiliginden yeniden acilmaz.
  const islendi = useRef(false);
  const [adim, setAdim] = useState<Adim>("davet");
  const [yanitlar, setYanitlar] = useState<Yanit[]>([]);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [secim, setSecim] = useState<Secim | null>(null);

  function sifirla() {
    setAdim("davet");
    setYanitlar([]);
    setSonuc(null);
    setSecim(null);
  }

  function gorulduYaz() {
    islendi.current = true;
    try {
      localStorage.setItem(ANAHTAR, "1");
    } catch {
      // yok say
    }
  }

  // Adim degisince odak soru metnine ya da sonuc basligina tasinir (cevap dugmesi odagi tutmasin).
  useEffect(() => {
    if (adim !== "davet") odakHedefi.current?.focus();
  }, [adim]);

  useEffect(() => {
    if (davetiBastir) return;
    let goruldu = false;
    try {
      goruldu = localStorage.getItem(ANAHTAR) !== null;
    } catch {
      // depolama kapaliysa yine acilir
    }
    if (goruldu) islendi.current = true;
    if (islendi.current) return;

    let acildi = false;
    const ac = () => {
      if (acildi || islendi.current) return;
      acildi = true;
      clearTimeout(zamanlayici);
      window.removeEventListener("scroll", kaydir);
      if (!pencere.current || pencere.current.open) return;
      setAdim("davet");
      pencere.current.showModal();
      gorulduYaz();
    };
    const kaydir = () => {
      if (window.scrollY >= document.documentElement.scrollHeight * 0.3) ac();
    };
    const zamanlayici = setTimeout(ac, 8000);
    window.addEventListener("scroll", kaydir, { passive: true });
    return () => {
      clearTimeout(zamanlayici);
      window.removeEventListener("scroll", kaydir);
    };
  }, [davetiBastir]);

  function yanitla(puan: Yanit) {
    if (typeof adim !== "number") return;
    const yeni = [...yanitlar.slice(0, adim), puan];
    setYanitlar(yeni);
    if (adim + 1 < MADDELER.length) {
      setAdim(adim + 1);
      return;
    }
    // Secim bir kez hesaplanir; yeniden cizimde liste karismasin.
    const s = degerlendir(yeni);
    setSonuc(s);
    setSecim(uzmanlariSec(uzmanlar, s));
    setAdim("sonuc");
  }

  function bolum(baslik: string, kind: "independent" | "student", liste: UzmanOzeti[], enUstAlan: string) {
    // Bu alanda hic uzman yoksa "Tumunu gor" bos liste acmasin diye alansiz baglanir.
    const alanVar = uzmanlar.some((u) => u.kind === kind && u.specialties.includes(enUstAlan as Alan));
    return (
      <section className="mt-5">
        <h3 className="font-semibold text-slate-900">{baslik}</h3>
        {kind === "independent" ? (
          <p className="mt-1 text-sm text-slate-600">
            Belgeleri onaylanmış psikolog ve psikolojik danışmanlar. Ücretli görüşme yaparlar; bazıları ücretsiz ön
            görüşme sunar.
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            Son sınıf Psikoloji/PDR öğrencileri. Görüşmeleri ücretsizdir ve staj kapsamındadır. <OnayGerekir />
          </p>
        )}
        {liste.length > 0 ? (
          <>
            <ul className="mt-3 space-y-3">
              {liste.map((u) => (
                <li key={u.id}>{kartlar[u.id]}</li>
              ))}
            </ul>
            <Link
              href={alanVar ? `/uzmanlar?alan=${enUstAlan}&tur=${kind}` : `/uzmanlar?tur=${kind}`}
              prefetch={false}
              className="mt-3 inline-block text-sm font-medium text-teal-800 underline"
            >
              Tümünü gör
            </Link>
          </>
        ) : (
          <Link href={`/uzmanlar?tur=${kind}`} prefetch={false} className="mt-3 inline-block text-sm font-medium text-teal-800 underline">
            Tüm uzmanları gör
          </Link>
        )}
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          gorulduYaz();
          sifirla();
          setAdim(0);
          pencere.current?.showModal();
        }}
        className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
      >
        Sana uygun uzmanı bul
      </button>
      <dialog
        ref={pencere}
        aria-labelledby="olcek-baslik"
        onClose={sifirla}
        className="m-auto max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-xl p-6 shadow-xl backdrop:bg-black/40"
      >
        <form method="dialog" className="float-right">
          <button aria-label="Kapat" className="rounded px-2 text-lg text-slate-600 hover:bg-slate-100">
            ✕
          </button>
        </form>

        {adim === "davet" && (
          <div>
            <h2 id="olcek-baslik" className="pr-8 text-lg font-semibold text-slate-900">Nereden başlayacağını bilmiyor musun?</h2>
            <p className="mt-2 text-sm text-slate-600">
              1 dakikalık birkaç soruyla sana uygun uzmanları gösterelim.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setAdim(0)} className={BIRINCIL}>
                Başlayalım
              </button>
              <form method="dialog">
                <button className={IKINCIL}>Şimdi değil</button>
              </form>
            </div>
          </div>
        )}

        {typeof adim === "number" && (
          <div>
            <progress
              value={adim + 1}
              max={MADDELER.length}
              aria-label={`Soru ${adim + 1} / ${MADDELER.length}`}
              className="w-full"
            />
            <p className="mt-3 text-sm text-slate-600">{GIRIS}</p>
            <p
              id="olcek-baslik"
              ref={odakHedefi as React.RefObject<HTMLParagraphElement>}
              tabIndex={-1}
              className="mt-2 font-medium text-slate-900 outline-none"
            >
              <span className="sr-only">
                Soru {adim + 1} / {MADDELER.length}.{" "}
              </span>
              {MADDELER[adim].metin}
            </p>
            <div className="mt-4 grid gap-2">
              {YANITLAR.map((etiket, puan) => (
                <button key={etiket} type="button" onClick={() => yanitla(puan as Yanit)} className={IKINCIL}>
                  {etiket}
                </button>
              ))}
            </div>
            {adim > 0 && (
              <button
                type="button"
                onClick={() => setAdim(adim - 1)}
                className="mt-4 text-sm font-medium text-teal-800 underline"
              >
                Geri
              </button>
            )}
          </div>
        )}

        {adim === "sonuc" && sonuc && secim && (
          <div>
            {sonuc.risk && (
              <aside role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                <p className="font-medium">Kendine zarar verme düşüncen varsa yalnız değilsin. Hemen 112&apos;yi ara.</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {ACIL_HATLAR.map((hat) => (
                    <li key={hat.numara} title={hat.aciklama}>
                      <a href={`tel:${hat.numara}`} className="font-bold underline">
                        {hat.numara}
                      </a>{" "}
                      {hat.ad}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
            <h2
              id="olcek-baslik"
              ref={odakHedefi as React.RefObject<HTMLHeadingElement>}
              tabIndex={-1}
              className="pr-8 text-lg font-semibold text-slate-900 outline-none"
            >
              İşte sana uygun uzmanlar
            </h2>
            {bolum("Bağımsız uzmanlar", "independent", secim.bagimsiz, sonuc.enUstAlan)}
            {secim.ogrenci !== null && bolum("Öğrenci uzmanlar", "student", secim.ogrenci, sonuc.enUstAlan)}
            <p className="mt-5 text-xs text-slate-600">Bu bir tanı değildir; yalnızca başlangıç için bir öneridir.</p>
          </div>
        )}
      </dialog>
    </>
  );
}
