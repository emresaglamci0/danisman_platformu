"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { basvuruYap } from "./islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { ALANLAR, ogrenciyeAcik, type Alan } from "@/lib/sabitler";
import { saatEtiketi } from "@/lib/seans-kurallari";

export function BasvuruFormu({
  uzmanId,
  secili,
  ogrenci,
  ciddiDurumlar,
}: {
  uzmanId: string;
  secili: string | null;
  ogrenci: boolean;
  ciddiDurumlar: string[];
}) {
  const [durum, gonder, bekliyor] = useActionState(basvuruYap, {});
  // Yanit yalnizca bu ekranda tutulur: depolanmaz, adrese yazilmaz.
  const [ciddiDurum, setCiddiDurum] = useState<"evet" | "hayir" | null>(null);

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="uzmanId" value={uzmanId} />
      <input type="hidden" name="baslangic" value={secili ?? ""} />

      {ogrenci && (
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium">Şu durumlardan biri için mi görüşmek istiyorsunuz?</legend>
          <ul className="list-disc pl-5 text-slate-700">
            {ciddiDurumlar.map((ad) => (
              <li key={ad}>{ad}</li>
            ))}
          </ul>
          <div className="flex gap-4">
            {(["evet", "hayir"] as const).map((deger) => (
              <label key={deger} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="ciddiDurum"
                  value={deger}
                  required
                  checked={ciddiDurum === deger}
                  onChange={() => setCiddiDurum(deger)}
                />
                {deger === "evet" ? "Evet" : "Hayır"}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="block text-sm font-medium">
        Konu <span className="font-normal text-slate-500">(isteğe bağlı)</span>
        <select name="konu" defaultValue="" className={girdiSinifi}>
          <option value="">Belirtmek istemiyorum</option>
          {Object.entries(ALANLAR)
            .filter(([deger]) => !ogrenci || ogrenciyeAcik(deger as Alan))
            .map(([deger, ad]) => (
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

      {ciddiDurum === "evet" ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          Listedeki durumlar, lisanslı bir uzmanın desteğini gerektirir. Öğrenci uzmanlar henüz lisanslı
          olmadığı için bu durumlarda görüşme yapamaz. Bu, sizinle ilgili olumsuz bir değerlendirme değildir;
          amaç, ihtiyacınıza uygun desteği almanızdır. Yanıtınız kaydedilmedi.{" "}
          <Link href="/uzmanlar" className="font-medium text-teal-800 underline">
            Uzmanları gör
          </Link>
        </p>
      ) : (
        <button disabled={bekliyor || !secili} className={butonSinifi}>
          {bekliyor ? "Gönderiliyor..." : secili ? `${saatEtiketi(secili)} için başvur` : "Önce bir saat seçin"}
        </button>
      )}
    </form>
  );
}
