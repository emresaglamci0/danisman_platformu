"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { kayitOl } from "./islemler";
import { butonSinifi, DurumMesaji, girdiSinifi } from "@/components/FormParcalari";
import { BOLUMLER, UNVANLAR } from "@/lib/sabitler";

const ROL_SECENEKLERI = [
  { deger: "client", baslik: "Danışan", aciklama: "Bir uzmandan destek almak istiyorum." },
  { deger: "expert", baslik: "Uzman", aciklama: "Psikolog veya psikolojik danışmanım." },
  {
    deger: "student_expert",
    baslik: "Öğrenci Uzman",
    aciklama: "Son sınıf Psikoloji/PDR öğrencisiyim, ücretsiz ve staj kapsamında görüşme yapacağım.",
  },
];

export function KayitFormu() {
  const [durum, gonder, bekliyor] = useActionState(kayitOl, {});
  const [rol, setRol] = useState("client");

  if (durum.basari) return <DurumMesaji durum={durum} />;

  return (
    <form action={gonder} className="space-y-5">
      <DurumMesaji durum={durum} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Hesap türü</legend>
        {ROL_SECENEKLERI.map((secenek) => (
          <label
            key={secenek.deger}
            className="flex cursor-pointer gap-3 rounded-lg border border-slate-300 bg-white p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
          >
            <input
              type="radio"
              name="rol"
              value={secenek.deger}
              checked={rol === secenek.deger}
              onChange={() => setRol(secenek.deger)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{secenek.baslik}</span>
              <span className="block text-sm text-slate-600">{secenek.aciklama}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="block text-sm font-medium">
        Ad soyad
        <input name="adSoyad" autoComplete="name" required minLength={2} maxLength={80} className={girdiSinifi} />
      </label>

      {rol === "expert" && (
        <label className="block text-sm font-medium">
          Unvan
          <select name="unvan" required defaultValue="" className={girdiSinifi}>
            <option value="" disabled>
              Seçin
            </option>
            {Object.entries(UNVANLAR).map(([deger, ad]) => (
              <option key={deger} value={deger}>
                {ad}
              </option>
            ))}
          </select>
        </label>
      )}

      {rol === "student_expert" && (
        <>
          <label className="block text-sm font-medium">
            Bölüm
            <select name="bolum" required defaultValue="" className={girdiSinifi}>
              <option value="" disabled>
                Seçin
              </option>
              {Object.entries(BOLUMLER).map(([deger, ad]) => (
                <option key={deger} value={deger}>
                  {ad}
                </option>
              ))}
            </select>
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="sonSinif" required className="mt-0.5" />
            <span>
              Son sınıf öğrencisiyim. Görüşmeleri <strong>ücretsiz</strong> yapacağımı ve hiçbir ad
              altında ödeme istemeyeceğimi kabul ediyorum.{" "}
              <Link href="/ogrenci-uzmanlar" target="_blank" className="text-teal-800 underline">
                Öğrenci Uzmanlar Hakkında
              </Link>
            </span>
          </label>
        </>
      )}

      {rol !== "client" && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          Uzman hesapları, belgeleriniz yönetici tarafından kontrol edilip onaylanana kadar
          listede görünmez. Belge yükleme bir sonraki aşamada eklenecek.
        </p>
      )}

      <label className="block text-sm font-medium">
        E-posta
        <input name="eposta" type="email" autoComplete="email" required className={girdiSinifi} />
      </label>
      <label className="block text-sm font-medium">
        Şifre <span className="font-normal text-slate-500">(en az 8 karakter)</span>
        <input
          name="sifre"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={girdiSinifi}
        />
      </label>

      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="kvkk" required className="mt-0.5" />
        <span>
          <Link href="/kvkk" target="_blank" className="text-teal-800 underline">
            KVKK Aydınlatma Metni
          </Link>
          &apos;ni okudum.
        </span>
      </label>

      <button disabled={bekliyor} className={butonSinifi}>
        {bekliyor ? "Kaydediliyor..." : "Kayıt ol"}
      </button>
    </form>
  );
}
