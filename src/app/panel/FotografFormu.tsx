"use client";

import { useActionState, useState } from "react";
import { fotografSil, fotografYukle } from "./dosya-islemleri";
import { DurumMesaji } from "@/components/FormParcalari";

const EN_FAZLA = 2 * 1024 * 1024;

export function FotografFormu({ fotografVar }: { fotografVar: boolean }) {
  const [durum, gonder, bekliyor] = useActionState(fotografYukle, {});
  const [yerelHata, setYerelHata] = useState("");

  return (
    <div className="space-y-3">
      <DurumMesaji durum={yerelHata ? { hata: yerelHata } : durum} />
      <form
        action={gonder}
        onSubmit={(e) => {
          const dosya = new FormData(e.currentTarget).get("fotograf");
          if (dosya instanceof File && dosya.size > EN_FAZLA) {
            e.preventDefault();
            setYerelHata("Fotoğraf en fazla 2 MB olabilir.");
          } else {
            setYerelHata("");
          }
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          name="fotograf"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2"
        />
        <button
          disabled={bekliyor}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-black hover:text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {bekliyor ? "Yükleniyor..." : fotografVar ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}
        </button>
      </form>
      {fotografVar && (
        <form action={fotografSil}>
          <button className="text-sm text-red-700 hover:underline">Fotoğrafı sil</button>
        </form>
      )}
      <p className="text-xs text-slate-500">
        JPG, PNG veya WebP, en fazla 2 MB. Fotoğrafınız küçültülür ve içindeki konum gibi gizli
        bilgiler silinir. Hesabınız onaylanana kadar başkalarına gösterilmez.
      </p>
    </div>
  );
}
