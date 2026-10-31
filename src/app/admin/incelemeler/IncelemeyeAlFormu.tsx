"use client";

import { useActionState } from "react";
import { incelemeyeAl } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function IncelemeyeAlFormu() {
  const [durum, gonder, bekliyor] = useActionState(incelemeyeAl, {});

  return (
    <form action={gonder} className="space-y-3">
      <DurumMesaji durum={durum} />
      <label className="block text-sm font-medium">
        Sohbet kimliği
        <input
          name="konusmaId"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={`${girdiSinifi} font-mono text-sm`}
        />
      </label>
      <label className="block text-sm font-medium">
        Sebep
        <textarea name="sebep" required minLength={10} maxLength={500} rows={2} className={girdiSinifi} />
      </label>
      <button
        disabled={bekliyor}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        İncelemeye al
      </button>
    </form>
  );
}
