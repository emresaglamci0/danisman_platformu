"use client";

import { useActionState } from "react";
import { uzmanOnayla, uzmanReddet } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function KararFormu({
  uzmanId,
  ogrenci,
  varsayilanTarih,
}: {
  uzmanId: string;
  ogrenci: boolean;
  varsayilanTarih: string;
}) {
  const [onayDurumu, onayla, onayBekliyor] = useActionState(uzmanOnayla, {});
  const [retDurumu, reddet, retBekliyor] = useActionState(uzmanReddet, {});

  if (onayDurumu.basari || retDurumu.basari) {
    return <DurumMesaji durum={onayDurumu.basari ? onayDurumu : retDurumu} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form action={onayla} className="space-y-2">
        <DurumMesaji durum={onayDurumu} />
        <input type="hidden" name="uzmanId" value={uzmanId} />
        {ogrenci && (
          <label className="block text-sm font-medium">
            Onay geçerlilik tarihi
            <input name="gecerlilik" type="date" required defaultValue={varsayilanTarih} className={girdiSinifi} />
          </label>
        )}
        <button
          disabled={onayBekliyor}
          className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          Onayla
        </button>
      </form>

      <form action={reddet} className="space-y-2">
        <DurumMesaji durum={retDurumu} />
        <input type="hidden" name="uzmanId" value={uzmanId} />
        <label className="block text-sm font-medium">
          Ret sebebi <span className="font-normal text-slate-500">(uzman bunu görecek)</span>
          <textarea name="sebep" required minLength={5} maxLength={500} rows={2} className={girdiSinifi} />
        </label>
        <button
          disabled={retBekliyor}
          className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          Reddet
        </button>
      </form>
    </div>
  );
}
