"use client";

import { useActionState } from "react";
import { girisYap } from "./islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function GirisFormu() {
  const [durum, gonder, bekliyor] = useActionState(girisYap, {});

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <label className="block text-sm font-medium">
        E-posta
        <input name="eposta" type="email" autoComplete="email" required className={girdiSinifi} />
      </label>
      <label className="block text-sm font-medium">
        Şifre
        <input name="sifre" type="password" autoComplete="current-password" required className={girdiSinifi} />
      </label>
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
    </form>
  );
}
