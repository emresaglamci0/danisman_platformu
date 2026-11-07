"use client";

import { useActionState, useState } from "react";
import { gorusmeBilgileriKaydet } from "./islemler";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { ILLER } from "@/lib/iller";
import { SEANS_SURELERI } from "@/lib/seans-kurallari";

type Bilgiler = {
  online: boolean;
  yuzYuze: boolean;
  il: string;
  ilce: string;
  sure: number | null;
};

export function GorusmeBilgileriFormu({ bilgiler }: { bilgiler: Bilgiler }) {
  const [durum, gonder, bekliyor] = useActionState(gorusmeBilgileriKaydet, {});
  const [online, setOnline] = useState(bilgiler.online);
  const [yuzYuze, setYuzYuze] = useState(bilgiler.yuzYuze);
  const [il, setIl] = useState(bilgiler.il);
  const [ilce, setIlce] = useState(bilgiler.ilce);
  const [sure, setSure] = useState(bilgiler.sure ? String(bilgiler.sure) : "");

  return (
    <form action={gonder} className="space-y-4">
      <DurumMesaji durum={durum} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Görüşme şekli (en az bir tane)</legend>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="online" checked={online} onChange={(e) => setOnline(e.target.checked)} />
          Online
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="yuzYuze" checked={yuzYuze} onChange={(e) => setYuzYuze(e.target.checked)} />
          Yüz yüze
        </label>
      </fieldset>
      {yuzYuze && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Şehir
            <select name="il" required value={il} onChange={(e) => setIl(e.target.value)} className={girdiSinifi}>
              <option value="" disabled>
                Seçin
              </option>
              {ILLER.map((ad) => (
                <option key={ad} value={ad}>
                  {ad}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            İlçe
            <input
              name="ilce"
              required
              maxLength={40}
              value={ilce}
              onChange={(e) => setIlce(e.target.value)}
              className={girdiSinifi}
            />
          </label>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Profilinizde yalnızca şehir ve ilçe görünür. Açık adres veya telefon yazmayın. Yüz yüze görüşmeler
            site üzerinden planlanmaz.
          </p>
        </div>
      )}
      <label className="block text-sm font-medium">
        Seans süresi
        <select name="sure" required value={sure} onChange={(e) => setSure(e.target.value)} className={girdiSinifi}>
          <option value="" disabled>
            Seçin
          </option>
          {SEANS_SURELERI.map((dakika) => (
            <option key={dakika} value={dakika}>
              {dakika} dakika
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={bekliyor}
        className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {bekliyor ? "Kaydediliyor..." : "Görüşme bilgilerini kaydet"}
      </button>
    </form>
  );
}
