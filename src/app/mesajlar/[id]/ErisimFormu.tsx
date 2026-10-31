"use client";

import { useActionState } from "react";
import { incelemeErisimiAc } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function ErisimFormu({ konusmaId }: { konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(incelemeErisimiAc, {});

  return (
    <form action={gonder} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="konusmaId" value={konusmaId} />
      <label className="block text-sm font-medium">
        Bu sohbeti neden açıyorsunuz?
        <textarea
          name="sebep"
          required
          minLength={10}
          maxLength={500}
          rows={3}
          placeholder="Örn: Taciz şikayetinin incelenmesi"
          className={girdiSinifi}
        />
      </label>
      <p className="text-xs text-slate-500">
        Erişim 30 dakika geçerlidir. Kimliğiniz, tarih/saat, sohbet ve yazdığınız sebep değiştirilemeyen
        erişim kaydına yazılır.
      </p>
      <button
        disabled={bekliyor}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {bekliyor ? "Açılıyor..." : "Sebebi kaydet ve sohbeti aç"}
      </button>
    </form>
  );
}
