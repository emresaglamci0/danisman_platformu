"use client";

import { useActionState } from "react";
import { basvuruYap } from "./islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { ALANLAR } from "@/lib/sabitler";
import { saatEtiketi } from "@/lib/seans-kurallari";

export function BasvuruFormu({
  uzmanId,
  secili,
  ogrenci,
}: {
  uzmanId: string;
  secili: string | null;
  ogrenci: boolean;
}) {
  const [durum, gonder, bekliyor] = useActionState(basvuruYap, {});

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="uzmanId" value={uzmanId} />
      <input type="hidden" name="baslangic" value={secili ?? ""} />

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

      <p className="text-xs text-slate-500">
        {ogrenci
          ? "Uzman başvurunuzu onaylarsa bu saat kesinleşir."
          : "Bu saat bir istektir, kesin saati uzman plana yazar."}{" "}
        Uzman yalnızca adınızı ve burada seçtiklerinizi görür. Sorununuzu yazmanız istenmez.
      </p>

      <button disabled={bekliyor || !secili} className={butonSinifi}>
        {bekliyor ? "Gönderiliyor..." : secili ? `${saatEtiketi(secili)} için başvur` : "Önce bir saat seçin"}
      </button>
    </form>
  );
}
