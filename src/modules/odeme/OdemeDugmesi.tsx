"use client";

import { useActionState } from "react";
import { DurumMesaji } from "@/components/FormParcalari";
import { demoOdemeYap, seansYapilmadiBildir } from "./islemler";

export function OdemeDugmesi({
  tur,
  planId,
  konusmaId,
}: {
  tur: "odeme" | "yapilmadi";
  planId: string;
  konusmaId: string;
}) {
  const [durum, gonder, bekliyor] = useActionState(tur === "odeme" ? demoOdemeYap : seansYapilmadiBildir, {});

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <form action={gonder} className="space-y-2">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="konusmaId" value={konusmaId} />
      {tur === "odeme" ? (
        <button
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {bekliyor ? "İşleniyor..." : "Öde (demo)"}
        </button>
      ) : (
        <button
          disabled={bekliyor}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          {bekliyor ? "Gönderiliyor..." : "Seans yapılmadı"}
        </button>
      )}
    </form>
  );
}
