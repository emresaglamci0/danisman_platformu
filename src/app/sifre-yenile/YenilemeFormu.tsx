"use client";

import { useActionState } from "react";
import { sifreYenile } from "../giris/islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function YenilemeFormu() {
  const [durum, gonder, bekliyor] = useActionState(sifreYenile, {});

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <label className="block text-sm font-medium">
        Yeni şifre{" "}
        <span className="font-normal text-slate-500">(en az 8 karakter; büyük ve küçük harf, rakam, simge)</span>
        <input
          name="sifre"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={girdiSinifi}
        />
      </label>
      <label className="block text-sm font-medium">
        Yeni şifre (tekrar)
        <input
          name="sifreTekrar"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={girdiSinifi}
        />
      </label>
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Kaydediliyor..." : "Şifremi yenile"}
      </button>
    </form>
  );
}
