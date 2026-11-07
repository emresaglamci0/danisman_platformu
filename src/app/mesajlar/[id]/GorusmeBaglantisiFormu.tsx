"use client";

import { useActionState } from "react";
import { gorusmeBaglantisiKaydet } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { GORUSME_BAGLANTISI_EN_FAZLA } from "@/lib/gorusme";

// Ucretsiz on gorusme icin tek seferlik baglanti. Yollandiktan sonra sayfa bu formu gostermez.
export function GorusmeBaglantisiFormu({ konusmaId }: { konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(gorusmeBaglantisiKaydet, {});

  return (
    <details className="rounded-lg border border-slate-200 p-3">
      <summary className="cursor-pointer font-medium">Ön görüşme bağlantısı yolla</summary>
      <form action={gonder} className="mt-3 space-y-3">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="konusmaId" value={konusmaId} />
        <p className="text-slate-600">
          Google Meet, Zoom veya Microsoft Teams bağlantınızı ekleyin. Yalnızca bu danışan görür. Görüşme bu sitenin
          dışında yapılır. <strong>Bu bağlantıyı yalnızca bir kez yollayabilirsiniz</strong>, sonra değiştiremezsiniz.
        </p>
        <label className="block font-medium">
          Bağlantı
          <input
            name="baglanti"
            type="url"
            required
            maxLength={GORUSME_BAGLANTISI_EN_FAZLA}
            placeholder="https://meet.google.com/..."
            className={girdiSinifi}
          />
        </label>
        <button
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {bekliyor ? "Yollanıyor..." : "Yolla"}
        </button>
      </form>
    </details>
  );
}
