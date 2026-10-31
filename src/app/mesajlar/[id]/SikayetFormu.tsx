"use client";

import { useActionState } from "react";
import { sikayetEt } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { SIKAYET_KATEGORILERI } from "@/lib/sabitler";

export function SikayetFormu({ konusmaId }: { konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(sikayetEt, {});

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <summary className="cursor-pointer font-medium text-red-800">Bu sohbeti şikayet et</summary>
      <form action={gonder} className="mt-3 space-y-3">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="konusmaId" value={konusmaId} />
        <label className="block font-medium">
          Sebep
          <select name="kategori" required defaultValue="" className={girdiSinifi}>
            <option value="" disabled>
              Seçin
            </option>
            {Object.entries(SIKAYET_KATEGORILERI).map(([deger, ad]) => (
              <option key={deger} value={deger}>
                {ad}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-medium">
          Kısa açıklama <span className="font-normal text-slate-500">(isteğe bağlı, sağlık bilgisi yazmayın)</span>
          <textarea name="not" maxLength={500} rows={2} className={girdiSinifi} />
        </label>
        <p className="text-xs text-slate-500">
          Şikayet ettiğinizde bu sohbet, güvenlik ve kötüye kullanımın önlenmesi amacıyla yetkili
          yönetici tarafından sebep belirtilerek incelenebilir. Karşı tarafa bildirim gitmez.
        </p>
        <button
          disabled={bekliyor}
          className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          {bekliyor ? "Gönderiliyor..." : "Şikayeti gönder"}
        </button>
      </form>
    </details>
  );
}
