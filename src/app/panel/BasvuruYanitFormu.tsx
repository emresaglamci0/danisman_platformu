"use client";

import { useActionState } from "react";
import { basvuruYanitla } from "./islemler";
import { DurumMesaji } from "@/components/FormParcalari";

export function BasvuruYanitFormu({ basvuruId }: { basvuruId: string }) {
  const [durum, gonder, bekliyor] = useActionState(basvuruYanitla, {});

  return (
    <form action={gonder} className="space-y-2">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="basvuruId" value={basvuruId} />
      <div className="flex gap-2">
        <button
          name="karar"
          value="accepted"
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          Kabul et
        </button>
        <button
          name="karar"
          value="rejected"
          disabled={bekliyor}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          Reddet
        </button>
      </div>
    </form>
  );
}
