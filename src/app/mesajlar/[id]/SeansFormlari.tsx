"use client";

import { useActionState, useState } from "react";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { GORUSME_BAGLANTISI_EN_FAZLA } from "@/lib/gorusme";
import { SAAT_ILK, SAAT_SON, UCRET_EN_AZ, UCRET_EN_FAZLA } from "@/lib/seans-kurallari";
import { planGeriCek, planGonder, planYanitla, seansBaglantisiKaydet, seansIptal } from "./seans-islemleri";

const SAATLER = Array.from({ length: SAAT_SON - SAAT_ILK + 1 }, (_, i) => SAAT_ILK + i);
const koyuDugme = "rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60";
const acikDugme = "rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-60";

function Gizli({ planId, konusmaId }: { planId: string; konusmaId: string }) {
  return (
    <>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="konusmaId" value={konusmaId} />
    </>
  );
}

export function PlanFormu({
  konusmaId,
  bagimsiz,
  sure,
  ilkTarih,
  ilkSaat,
  enErken,
  enGec,
}: {
  konusmaId: string;
  bagimsiz: boolean;
  sure: number;
  ilkTarih: string;
  ilkSaat: number;
  enErken: string;
  enGec: string;
}) {
  const [durum, gonder, bekliyor] = useActionState(planGonder, {});
  const [tarih, setTarih] = useState(ilkTarih);
  const [saat, setSaat] = useState(String(ilkSaat));
  const [ucret, setUcret] = useState("");

  return (
    <details className="rounded-lg border border-slate-200 p-3">
      <summary className="cursor-pointer font-medium">
        {bagimsiz ? "Plan yolla" : "Seans randevusu yolla"}
      </summary>
      <form action={gonder} className="mt-3 space-y-3">
        <DurumMesaji durum={durum} />
        <input type="hidden" name="konusmaId" value={konusmaId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block font-medium">
            Tarih
            <input
              name="tarih"
              type="date"
              required
              min={enErken}
              max={enGec}
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className={girdiSinifi}
            />
          </label>
          <label className="block font-medium">
            Saat
            <select name="saat" value={saat} onChange={(e) => setSaat(e.target.value)} className={girdiSinifi}>
              {SAATLER.map((s) => (
                <option key={s} value={s}>
                  {String(s).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
        </div>
        {bagimsiz && (
          <label className="block font-medium">
            Seans başı ücret (₺)
            <input
              name="ucret"
              type="number"
              required
              min={UCRET_EN_AZ}
              max={UCRET_EN_FAZLA}
              step={1}
              value={ucret}
              onChange={(e) => setUcret(e.target.value)}
              className={girdiSinifi}
            />
          </label>
        )}
        <p className="text-slate-600">
          Seans süresi: {sure} dakika. Yolladığınız anda bu saat başkasına kapanır. Danışan 24 saat içinde yanıt
          vermezse yeniden açılır.
        </p>
        <button disabled={bekliyor} className={koyuDugme}>
          {bekliyor ? "Gönderiliyor..." : "Yolla"}
        </button>
      </form>
    </details>
  );
}

export function PlanYanitFormu({ planId, konusmaId, redYalniz }: { planId: string; konusmaId: string; redYalniz?: boolean }) {
  const [durum, gonder, bekliyor] = useActionState(planYanitla, {});
  return (
    <form action={gonder} className="space-y-2">
      <DurumMesaji durum={durum} />
      <Gizli planId={planId} konusmaId={konusmaId} />
      <div className="flex gap-2">
        {!redYalniz && (
          <button name="karar" value="onay" disabled={bekliyor} className={koyuDugme}>
            Onayla
          </button>
        )}
        <button name="karar" value="ret" disabled={bekliyor} className={acikDugme}>
          Reddet
        </button>
      </div>
    </form>
  );
}

export function GeriCekFormu({ planId, konusmaId }: { planId: string; konusmaId: string }) {
  const [durum, gonder, bekliyor] = useActionState(planGeriCek, {});
  return (
    <form action={gonder} className="space-y-2">
      <DurumMesaji durum={durum} />
      <Gizli planId={planId} konusmaId={konusmaId} />
      <button disabled={bekliyor} className={acikDugme}>
        Geri çek
      </button>
    </form>
  );
}

export function IptalFormu({ planId, konusmaId, aciklama }: { planId: string; konusmaId: string; aciklama: string }) {
  const [durum, gonder, bekliyor] = useActionState(seansIptal, {});
  return (
    <details>
      <summary className="cursor-pointer text-teal-800">Seansı iptal et</summary>
      <form action={gonder} className="mt-2 space-y-2">
        <DurumMesaji durum={durum} />
        <Gizli planId={planId} konusmaId={konusmaId} />
        <p className="text-slate-600">{aciklama}</p>
        <button disabled={bekliyor} className={acikDugme}>
          İptali onayla
        </button>
      </form>
    </details>
  );
}

export function SeansBaglantisiFormu({
  planId,
  konusmaId,
  baglanti,
}: {
  planId: string;
  konusmaId: string;
  baglanti: string;
}) {
  const [durum, gonder, bekliyor] = useActionState(seansBaglantisiKaydet, {});
  const [adres, setAdres] = useState(baglanti);
  return (
    <form action={gonder} className="space-y-2">
      <DurumMesaji durum={durum} />
      <Gizli planId={planId} konusmaId={konusmaId} />
      <label className="block font-medium">
        Görüşme bağlantısı
        <input
          name="baglanti"
          type="url"
          required
          maxLength={GORUSME_BAGLANTISI_EN_FAZLA}
          placeholder="https://meet.google.com/..."
          value={adres}
          onChange={(e) => setAdres(e.target.value)}
          className={girdiSinifi}
        />
      </label>
      <button disabled={bekliyor} className={koyuDugme}>
        {bekliyor ? "Kaydediliyor..." : "Bağlantıyı kaydet"}
      </button>
    </form>
  );
}
