"use client";

import { useActionState } from "react";
import { koduDogrula } from "./islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function KodFormu({ faktorId, dugmeYazisi = "Doğrula" }: { faktorId: string; dugmeYazisi?: string }) {
  const [durum, gonder, bekliyor] = useActionState(koduDogrula, {});

  return (
    <form action={gonder} className="space-y-3">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="faktorId" value={faktorId} />
      <label className="block text-sm font-medium">
        6 haneli kod
        <input
          name="kod"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123456"
          className={`${girdiSinifi} text-center font-mono text-2xl tracking-widest`}
        />
      </label>
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Doğrulanıyor..." : dugmeYazisi}
      </button>
    </form>
  );
}
