"use client";

import { useActionState } from "react";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { uzmanReddet } from "../islemler";

// Site disina odeme yonlendirmesi: kanit varsa uzman hesabi kapatilir (kullanici karari, 2026-11-07).
// Mevcut ret islemi kullanilir; gelecek seanslar iptal olur, bekletmedeki odemeler iade edilir.
export function UzmanKapatFormu({ uzmanId }: { uzmanId: string }) {
  const [durum, gonder, bekliyor] = useActionState(uzmanReddet, {});

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-red-800">Kanıt varsa uzmanın hesabını kapat</summary>
      <form action={gonder} className="mt-2 space-y-2">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="uzmanId" value={uzmanId} />
        <p className="text-slate-600">
          Kanıt yoksa iki tarafa da yaptırım uygulanmaz. Bu işlem uzmanı listeden kaldırır, gelecek seanslarını iptal eder
          ve bekletmedeki ödemeleri iade eder.
        </p>
        <label className="block font-medium">
          Sebep <span className="font-normal text-slate-500">(uzman bunu görecek)</span>
          <textarea name="sebep" required minLength={5} maxLength={500} rows={2} className={girdiSinifi} />
        </label>
        <button
          disabled={bekliyor}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          Hesabı kapat
        </button>
      </form>
    </details>
  );
}
