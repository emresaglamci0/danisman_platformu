"use client";

import { useActionState } from "react";
import { ayrilanUzmanSohbetiniSil } from "./islemler";
import { DurumMesaji } from "@/components/FormParcalari";

export function SohbetSilmeFormu({ konusmaId }: { konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(ayrilanUzmanSohbetiniSil, {});

  return (
    <details>
      <summary className="cursor-pointer font-medium">Sohbeti şimdi sil</summary>
      <form action={gonder} className="mt-3 space-y-3">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="konusmaId" value={konusmaId} />
        <label className="flex gap-2">
          <input type="checkbox" name="onay" required className="mt-0.5" />
          Bu sohbetin ve mesajların kalıcı olarak silineceğini anladım.
        </label>
        <button
          disabled={bekliyor}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {bekliyor ? "Siliniyor..." : "Sohbeti kalıcı olarak sil"}
        </button>
      </form>
    </details>
  );
}
