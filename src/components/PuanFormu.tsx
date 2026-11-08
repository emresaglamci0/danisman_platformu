"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { puanVer } from "@/app/uzmanlar/[id]/puan-islemleri";
import { DurumMesaji } from "@/components/FormParcalari";
import { PuanSecici } from "@/components/PuanSecici";

export function PuanFormu({
  uzmanId,
  mevcutPuan,
  ekDugme,
  basarida,
  kaynak,
}: {
  kaynak?: "pencere";
  uzmanId: string;
  mevcutPuan?: number | null;
  ekDugme?: ReactNode;
  basarida?: () => void;
}) {
  const [durum, gonder, bekliyor] = useActionState(puanVer, {});
  const basaridaRef = useRef(basarida);
  useEffect(() => {
    basaridaRef.current = basarida;
  });

  // Her başarılı dönüş yeni bir durum nesnesidir; yalnızca o zaman bir kez çağrılır.
  useEffect(() => {
    if (durum.basari) basaridaRef.current?.();
  }, [durum]);

  return (
    <form action={gonder} className="space-y-3">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="uzmanId" value={uzmanId} />
      {kaynak && <input type="hidden" name="kaynak" value={kaynak} />}
      <PuanSecici ad="puan" baslangic={mevcutPuan} />
      <div className="flex items-center justify-end gap-2">
        {ekDugme}
        <button
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {bekliyor ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </form>
  );
}
