"use client";

import { useState, useTransition } from "react";
import { kurulumuBaslat, type KurulumBilgisi } from "./islemler";
import { butonSinifi, DurumMesaji } from "@/components/FormParcalari";
import { KodFormu } from "./KodFormu";

export function KurulumAlani() {
  const [bilgi, setBilgi] = useState<KurulumBilgisi>({});
  const [bekliyor, baslat] = useTransition();

  if (!bilgi.faktorId) {
    return (
      <div className="space-y-3">
        <DurumMesaji durum={{ hata: bilgi.hata }} />
        <button
          disabled={bekliyor}
          onClick={() => baslat(async () => setBilgi(await kurulumuBaslat()))}
          className={butonSinifi}
        >
          {bekliyor ? "Hazırlanıyor..." : "Kurulumu başlat"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Telefonunuzda Google Authenticator, Microsoft Authenticator veya benzeri bir uygulama açın.</li>
        <li>Aşağıdaki QR kodu bu uygulamayla okutun.</li>
        <li>Uygulamada beliren 6 haneli kodu aşağıya yazın.</li>
      </ol>
      {/* QR kod Supabase tarafindan SVG olarak uretilir */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bilgi.qr} alt="İki adımlı doğrulama QR kodu" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-600">QR kodu okutamıyorum</summary>
        <p className="mt-2">Uygulamaya bu anahtarı elle girin:</p>
        <code className="mt-1 block break-all rounded bg-slate-100 p-2 font-mono text-xs">{bilgi.gizliAnahtar}</code>
      </details>
      <KodFormu faktorId={bilgi.faktorId} dugmeYazisi="Kurulumu tamamla" />
    </div>
  );
}
