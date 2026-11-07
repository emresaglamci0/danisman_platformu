"use client";

import { useActionState } from "react";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { grupAc, grupBaglantisiKaydet, grupIptalEt } from "@/app/grup-seanslari/islemler";
import { GORUSME_BAGLANTISI_EN_FAZLA } from "@/lib/gorusme";
import { ALANLAR } from "@/lib/sabitler";
import { SAAT_ILK, SAAT_SON, UCRET_EN_AZ, UCRET_EN_FAZLA } from "@/lib/seans-kurallari";

const SAATLER = Array.from({ length: SAAT_SON - SAAT_ILK + 1 }, (_, i) => SAAT_ILK + i);
const koyuDugme = "rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60";

export function GrupSeansFormu({ enErken, enGec }: { enErken: string; enGec: string }) {
  const [durum, gonder, bekliyor] = useActionState(grupAc, {});

  return (
    <form action={gonder} className="space-y-3 text-sm">
      <DurumMesaji durum={durum} />
      <label className="block font-medium">
        Konu
        <select name="konu" required defaultValue="" className={girdiSinifi}>
          <option value="" disabled>
            Seçin
          </option>
          {Object.entries(ALANLAR).map(([deger, ad]) => (
            <option key={deger} value={deger}>
              {ad}
            </option>
          ))}
        </select>
      </label>
      <label className="block font-medium">
        Amaç <span className="font-normal text-slate-500">(herkese açık, sağlık bilgisi ve iletişim bilgisi yazmayın)</span>
        <textarea name="amac" required minLength={10} maxLength={500} rows={3} className={girdiSinifi} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block font-medium">
          Tarih
          <input name="tarih" type="date" required min={enErken} max={enGec} className={girdiSinifi} />
        </label>
        <label className="block font-medium">
          Saat
          <select name="saat" defaultValue="18" className={girdiSinifi}>
            {SAATLER.map((s) => (
              <option key={s} value={s}>
                {String(s).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
        <label className="block font-medium">
          Kişi başı ücret (₺)
          <input name="ucret" type="number" required min={UCRET_EN_AZ} max={UCRET_EN_FAZLA} step={1} className={girdiSinifi} />
        </label>
      </div>
      <p className="text-slate-600">
        Seans süreniz görüşme bilgilerinizdeki süredir. Bu saat takviminizde kapanır. Seansa 12 saat kala 3 kişi olmazsa
        seans iptal edilir.
      </p>
      <button disabled={bekliyor} className={koyuDugme}>
        {bekliyor ? "Açılıyor..." : "Grup seansı aç"}
      </button>
    </form>
  );
}

export function GrupIptalFormu({ grupId }: { grupId: string }) {
  const [durum, gonder, bekliyor] = useActionState(grupIptalEt, {});
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-teal-800">Seansı iptal et</summary>
      <form action={gonder} className="mt-2 space-y-2">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="grupId" value={grupId} />
        <p className="text-slate-600">Tüm katılımcıların demo ödemesi iade edilmiş sayılır ve saat yeniden açılır.</p>
        <button
          disabled={bekliyor}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-60"
        >
          İptali onayla
        </button>
      </form>
    </details>
  );
}

export function GrupBaglantiFormu({ grupId, baglanti }: { grupId: string; baglanti: string }) {
  const [durum, gonder, bekliyor] = useActionState(grupBaglantisiKaydet, {});
  return (
    <form action={gonder} className="space-y-2 text-sm">
      <DurumMesaji durum={durum} />
      <input type="hidden" name="grupId" value={grupId} />
      <label className="block font-medium">
        Görüşme bağlantısı <span className="font-normal text-slate-500">(yalnızca katılımcılar görür)</span>
        <input
          name="baglanti"
          type="url"
          required
          defaultValue={baglanti}
          maxLength={GORUSME_BAGLANTISI_EN_FAZLA}
          placeholder="https://meet.google.com/..."
          className={girdiSinifi}
        />
      </label>
      <button disabled={bekliyor} className={koyuDugme}>
        {bekliyor ? "Kaydediliyor..." : "Bağlantıyı kaydet"}
      </button>
    </form>
  );
}
