"use client";

import { useState } from "react";
import { PsikologCizimi } from "@/components/PsikologCizimi";
import { oneCikanKartlar } from "./kurallar";
import { RahatsizlikKarti } from "./RahatsizlikKarti";
import { HISLER, RAHATSIZLIKLAR } from "./veri";

// Secilen hisler yalnizca bu bilesenin bellegindedir; URL, depolama veya sunucuya yazilmaz.
export function RahatsizlikListesi() {
  const [secili, setSecili] = useState<string[]>([]);
  const oneCikan = oneCikanKartlar(secili, HISLER);

  const degistir = (ad: string) =>
    setSecili((s) => (s.includes(ad) ? s.filter((x) => x !== ad) : [...s, ad]));

  return (
    <div className="space-y-6">
      <section aria-labelledby="hisler-baslik" className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 id="hisler-baslik" className="text-lg font-semibold">
            Neler yaşıyorsun? (birden fazla seçebilirsin)
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {HISLER.map((h) => {
              const sec = secili.includes(h.ad);
              return (
                <button
                  key={h.ad}
                  type="button"
                  aria-pressed={sec}
                  onClick={() => degistir(h.ad)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                    sec ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  {sec && <span aria-hidden="true">✓ </span>}
                  {h.ad}
                </button>
              );
            })}
          </div>
          {secili.length > 0 && (
            <button
              type="button"
              onClick={() => setSecili([])}
              className="mt-3 cursor-pointer text-sm text-teal-800 underline focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              Seçimi temizle
            </button>
          )}
          <p aria-live="polite" className="sr-only">
            {oneCikan ? `${oneCikan.size} rahatsızlık öne çıkarıldı` : ""}
          </p>
        </div>
        <div className="shrink-0">
          <PsikologCizimi ampul={secili.length > 0} />
        </div>
      </section>

      <h2 className="sr-only">Rahatsızlıklar</h2>
      <ul className="grid items-start gap-3 sm:grid-cols-2">
        {RAHATSIZLIKLAR.map((r) => (
          <RahatsizlikKarti key={r.ad} r={r} soluk={oneCikan !== null && !oneCikan.has(r.ad)} />
        ))}
      </ul>
    </div>
  );
}
