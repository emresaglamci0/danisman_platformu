"use client";

import { useActionState, useState } from "react";
import { belgeYukle } from "./dosya-islemleri";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { BELGE_TURLERI, type BelgeTuru } from "@/lib/sabitler";

const EN_FAZLA = 5 * 1024 * 1024;

export function BelgeYuklemeFormu({ turler }: { turler: BelgeTuru[] }) {
  const [durum, gonder, bekliyor] = useActionState(belgeYukle, {});
  const [yerelHata, setYerelHata] = useState("");

  return (
    <form
      action={gonder}
      // Buyuk dosyayi sunucuya gondermeden once tarayicida da kontrol et
      onSubmit={(e) => {
        const dosya = new FormData(e.currentTarget).get("dosya");
        if (dosya instanceof File && dosya.size > EN_FAZLA) {
          e.preventDefault();
          setYerelHata("Dosya en fazla 5 MB olabilir.");
        } else {
          setYerelHata("");
        }
      }}
      className="space-y-3"
    >
      <DurumMesaji durum={yerelHata ? { hata: yerelHata } : durum} />
      <label className="block text-sm font-medium">
        Belge türü
        <select name="belgeTuru" required defaultValue="" className={girdiSinifi}>
          <option value="" disabled>
            Seçin
          </option>
          {turler.map((tur) => (
            <option key={tur} value={tur}>
              {BELGE_TURLERI[tur].ad}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Dosya <span className="font-normal text-slate-500">(PDF, JPG veya PNG, en fazla 5 MB)</span>
        <input
          name="dosya"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png"
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2"
        />
      </label>
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Yükleniyor..." : "Belgeyi yükle"}
      </button>
    </form>
  );
}
