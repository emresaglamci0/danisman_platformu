"use client";

import { useActionState, useState } from "react";
import { gorusmeBaglantisiKaydet } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { GORUSME_BAGLANTISI_EN_FAZLA } from "@/lib/gorusme";

export function GorusmeBaglantisiFormu({ konusmaId, baglanti }: { konusmaId: string; baglanti: string }) {
  const [durum, gonder, bekliyor] = useActionState(gorusmeBaglantisiKaydet, {});
  const [adres, setAdres] = useState(baglanti);

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm" open={!!baglanti}>
      <summary className="cursor-pointer font-semibold">Görüntülü görüşme bağlantısı</summary>
      <form action={gonder} className="mt-3 space-y-3">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="konusmaId" value={konusmaId} />
        <p className="text-slate-600">
          Google Meet, Zoom veya Microsoft Teams bağlantınızı ekleyin. Yalnızca bu danışan görür. Görüşme bu
          sitenin dışında yapılır. Silmek için alanı boşaltıp kaydedin.
        </p>
        <label className="block font-medium">
          Bağlantı
          <input
            name="baglanti"
            type="url"
            maxLength={GORUSME_BAGLANTISI_EN_FAZLA}
            placeholder="https://meet.google.com/..."
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
            className={girdiSinifi}
          />
        </label>
        <button
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-black hover:text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {bekliyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </details>
  );
}
