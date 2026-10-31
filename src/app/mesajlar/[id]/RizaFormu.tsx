"use client";

import { useActionState } from "react";
import { rizaVer } from "./islemler";
import { butonSinifi, DurumMesaji } from "@/components/FormParcalari";

export function RizaFormu({ konusmaId }: { konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(rizaVer, {});

  return (
    <form action={gonder} className="space-y-3">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="konusmaId" value={konusmaId} />
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="aydinlatma" required className="mt-0.5" />
        KVKK Aydınlatma Metni&apos;ni okudum ve anladım.
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="acikRiza" required className="mt-0.5" />
        Açık Rıza Metni&apos;nde belirtilen şekilde özel nitelikli kişisel verilerimin işlenmesine açık rıza veriyorum.
      </label>
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Kaydediliyor..." : "Onaylıyorum, mesajlaşmaya başla"}
      </button>
    </form>
  );
}
