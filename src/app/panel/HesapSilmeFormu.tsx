"use client";

import { useActionState } from "react";
import { hesabiSil } from "./hesap-islemleri";
import { DurumMesaji, girdiSinifi } from "@/components/FormParcalari";

export function HesapSilmeFormu({ uzman }: { uzman: boolean }) {
  const [durum, gonder, bekliyor] = useActionState(hesabiSil, {});

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer font-semibold">Hesabımı sil</summary>
      <form action={gonder} className="mt-4 space-y-4">
        <DurumMesaji durum={durum} />
        <div className="text-sm text-slate-600">
          <p>Bu işlem geri alınamaz. Şunlar kalıcı olarak silinir:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Hesabınız, profiliniz, fotoğrafınız ve belgeleriniz</li>
            <li>Başvurularınız</li>
            {!uzman && <li>Sohbetleriniz ve mesajlarınız (uzman da bu sohbetlere erişemez)</li>}
          </ul>
          {uzman && (
            <p className="mt-2">
              <strong>Danışanlarınız sohbetlerini kaybetmez:</strong> adınız silinir, ama sohbetler ve
              gönderdiğiniz mesajlar danışanda salt okunur olarak en fazla 6 ay daha kalır. Sonra otomatik silinir.
            </p>
          )}
        </div>
        <label className="block text-sm font-medium">
          Şifreniz
          <input name="sifre" type="password" autoComplete="current-password" required className={girdiSinifi} />
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="onay" required className="mt-0.5" />
          Hesabımın ve verilerimin kalıcı olarak silineceğini anladım.
        </label>
        <button
          disabled={bekliyor}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {bekliyor ? "Siliniyor..." : "Hesabımı kalıcı olarak sil"}
        </button>
      </form>
    </details>
  );
}
