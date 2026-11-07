"use client";

import { useActionState, useState } from "react";
import { haftalikDuzenKaydet } from "./islemler";
import { DurumMesaji } from "@/components/FormParcalari";
import { SAAT_ILK, SAAT_SON, TAM_GUN_ADLARI } from "@/lib/seans-kurallari";

const SAATLER = Array.from({ length: SAAT_SON - SAAT_ILK + 1 }, (_, i) => SAAT_ILK + i);
const saatYaz = (saat: number) => `${String(saat).padStart(2, "0")}:00`;

// secili degerleri: "gun-saat", ornek "2-14" sali 14:00
export function HaftalikTablo({ secili }: { secili: string[] }) {
  const [durum, gonder, bekliyor] = useActionState(haftalikDuzenKaydet, {});
  const [kutular, setKutular] = useState(() => new Set(secili));

  function degistir(deger: string) {
    const yeni = new Set(kutular);
    if (!yeni.delete(deger)) yeni.add(deger);
    setKutular(yeni);
  }

  return (
    <form action={gonder} className="space-y-3">
      <DurumMesaji durum={durum} />
      {[...kutular].map((deger) => (
        <input key={deger} type="hidden" name="saat" value={deger} />
      ))}
      <div className="overflow-x-auto">
        <div className="grid min-w-[36rem] grid-cols-[3.5rem_repeat(7,1fr)] gap-1 text-center text-xs">
          <div />
          {TAM_GUN_ADLARI.map((gun) => (
            <div key={gun} className="py-1 font-semibold text-slate-600">
              {gun.slice(0, 3)}
            </div>
          ))}
          {SAATLER.map((saat) => (
            <div key={saat} className="contents">
              <div className="py-2 text-slate-600">{saatYaz(saat)}</div>
              {TAM_GUN_ADLARI.map((gun, i) => {
                const deger = `${i + 1}-${saat}`;
                const acik = kutular.has(deger);
                return (
                  <button
                    key={deger}
                    type="button"
                    aria-pressed={acik}
                    aria-label={`${gun} ${saatYaz(saat)}`}
                    onClick={() => degistir(deger)}
                    className={`min-h-9 rounded-md border ${
                      acik
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {acik ? saatYaz(saat) : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <button
        disabled={bekliyor}
        className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {bekliyor ? "Kaydediliyor..." : "Saatleri kaydet"}
      </button>
    </form>
  );
}
