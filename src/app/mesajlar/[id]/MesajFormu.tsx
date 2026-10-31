"use client";

import { useActionState, useEffect, useRef } from "react";
import { mesajGonder } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { MESAJ_EN_FAZLA } from "@/lib/sabitler";

export function MesajFormu({ konusmaId }: { konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(mesajGonder, {});
  const form = useRef<HTMLFormElement>(null);

  // Mesaj gidince yazma alanini temizle
  useEffect(() => {
    if (durum.basari) form.current?.reset();
  }, [durum]);

  return (
    <form ref={form} action={gonder} className="space-y-2">
      {durum.hata && <DurumMesaji durum={durum} />}
      <input type="hidden" name="konusmaId" value={konusmaId} />
      <label className="sr-only" htmlFor="metin">
        Mesajınız
      </label>
      <textarea
        id="metin"
        name="metin"
        required
        maxLength={MESAJ_EN_FAZLA}
        rows={3}
        placeholder="Mesajınızı yazın..."
        className={girdiSinifi}
      />
      <div className="flex justify-end">
        <button
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {bekliyor ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </form>
  );
}
