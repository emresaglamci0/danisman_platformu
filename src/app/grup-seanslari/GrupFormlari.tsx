"use client";

import { useActionState } from "react";
import Link from "next/link";
import { DurumMesaji, butonSinifi } from "@/components/FormParcalari";
import { grupAyril, grupKatil } from "./islemler";

export function KatilFormu({ grupId, tutar, odemeAcik }: { grupId: string; tutar: string; odemeAcik: boolean }) {
  const [durum, gonder, bekliyor] = useActionState(grupKatil, {});

  return (
    <form action={gonder} className="space-y-3">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="grupId" value={grupId} />
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="onay" required className="mt-0.5" />
        <span>
          <Link href="/kvkk" target="_blank" className="text-teal-800 underline">
            Aydınlatma metnini
          </Link>{" "}
          okudum. Bu grup seansına katıldığım bilgisinin, seansın konusu sağlık veya psikolojik duruma ilişkin bilgi
          verebileceği için hizmetin sunulması amacıyla işlenmesine ve Almanya&apos;daki (Frankfurt) sunucularda
          saklanmasına açık rıza veriyorum.
        </span>
      </label>
      {odemeAcik && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Yeriniz ödemeyle ayrılır. Bu bir demodur, para çekilmez. Kart bilgisi istenmez.
        </p>
      )}
      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "İşleniyor..." : odemeAcik ? `${tutar} öde ve katıl (demo)` : "Katıl"}
      </button>
    </form>
  );
}

export function AyrilFormu({ grupId, aciklama }: { grupId: string; aciklama: string }) {
  const [durum, gonder, bekliyor] = useActionState(grupAyril, {});

  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-teal-800">Seanstan ayrıl</summary>
      <form action={gonder} className="mt-2 space-y-2">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="grupId" value={grupId} />
        <p className="text-slate-600">{aciklama}</p>
        <button
          disabled={bekliyor}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-60"
        >
          Ayrılmayı onayla
        </button>
      </form>
    </details>
  );
}
