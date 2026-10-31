"use client";

import { useActionState } from "react";
import { basvuruYap } from "./islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { ALANLAR, UYGUN_ZAMANLAR } from "@/lib/sabitler";

export function BasvuruFormu({ uzmanId }: { uzmanId: string }) {
  const [durum, gonder, bekliyor] = useActionState(basvuruYap, {});

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="uzmanId" value={uzmanId} />

      <label className="block text-sm font-medium">
        Konu <span className="font-normal text-slate-500">(isteğe bağlı)</span>
        <select name="konu" defaultValue="" className={girdiSinifi}>
          <option value="">Belirtmek istemiyorum</option>
          {Object.entries(ALANLAR).map(([deger, ad]) => (
            <option key={deger} value={deger}>
              {ad}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Size uygun zaman</legend>
        {Object.entries(UYGUN_ZAMANLAR).map(([deger, ad]) => (
          <label key={deger} className="flex gap-2 text-sm">
            <input type="radio" name="zaman" value={deger} required />
            {ad}
          </label>
        ))}
      </fieldset>

      <p className="text-xs text-slate-500">
        Uzman yalnızca adınızı ve burada seçtiklerinizi görür. Sorununuzu yazmanız istenmez.
      </p>

      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Gönderiliyor..." : "Başvur"}
      </button>
    </form>
  );
}
