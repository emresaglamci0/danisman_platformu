"use client";

import { useActionState } from "react";
import { sifreSifirlamaIste } from "../giris/islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function SifirlamaFormu() {
  const [durum, gonder, bekliyor] = useActionState(sifreSifirlamaIste, {});

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <label className="block text-sm font-medium">
        E-posta
        <input name="eposta" type="email" autoComplete="email" required className={girdiSinifi} />
      </label>
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Gönderiliyor..." : "Bağlantı gönder"}
      </button>
    </form>
  );
}
