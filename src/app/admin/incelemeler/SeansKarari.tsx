"use client";

import { useActionState } from "react";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { grupKarariVer, seansKarariVer } from "./islemler";

export function SeansKarari({ isaretId, grup }: { isaretId: string; grup: boolean }) {
  const [durum, gonder, bekliyor] = useActionState(grup ? grupKarariVer : seansKarariVer, {});

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <form action={gonder} className="mt-2 space-y-2">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="isaretId" value={isaretId} />
      <label className="block font-medium">
        Sebep (10-500 karakter)
        <textarea name="sebep" required minLength={10} maxLength={500} rows={2} className={girdiSinifi} />
      </label>
      <div className="flex gap-2">
        <button
          name="karar"
          value="iade"
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          İade et
        </button>
        <button
          name="karar"
          value="aktar"
          disabled={bekliyor}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-white disabled:opacity-60"
        >
          Uzmana aktar
        </button>
      </div>
    </form>
  );
}
