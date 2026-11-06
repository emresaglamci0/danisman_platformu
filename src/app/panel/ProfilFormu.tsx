"use client";

import { useActionState, useState } from "react";
import { profilGuncelle } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { ALANLAR, TANITIM_EN_FAZLA, type Alan } from "@/lib/sabitler";

// Alanlar state'te tutulur: React gonderimden sonra formu sifirlar, hata olursa yazilanlar kaybolmasin.
export function ProfilFormu({ tanitim, alanlar }: { tanitim: string; alanlar: Alan[] }) {
  const [durum, gonder, bekliyor] = useActionState(profilGuncelle, {});
  const [metin, setMetin] = useState(tanitim);
  const [secili, setSecili] = useState(alanlar);

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <label className="block text-sm font-medium">
        Tanıtım yazısı{" "}
        <span className="font-normal text-slate-500">
          ({metin.length}/{TANITIM_EN_FAZLA})
        </span>
        <textarea
          name="tanitim"
          rows={5}
          maxLength={TANITIM_EN_FAZLA}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          className={girdiSinifi}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Çalıştığım alanlar (en az bir tane)</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(Object.keys(ALANLAR) as Alan[]).map((alan) => (
            <label key={alan} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                name="alanlar"
                value={alan}
                checked={secili.includes(alan)}
                onChange={(e) =>
                  setSecili(e.target.checked ? [...secili, alan] : secili.filter((a) => a !== alan))
                }
                className="mt-0.5"
              />
              {ALANLAR[alan]}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        disabled={bekliyor}
        className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {bekliyor ? "Kaydediliyor..." : "Profili kaydet"}
      </button>
    </form>
  );
}
