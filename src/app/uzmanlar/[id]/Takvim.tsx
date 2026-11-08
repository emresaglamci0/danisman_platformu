"use client";

import { useState, type ReactNode } from "react";
import { GORUNEN_HAFTA, haftaGunleri, saatEtiketi, saatIso, saatParcalari } from "@/lib/seans-kurallari";
import { BasvuruFormu } from "./BasvuruFormu";

const saatYaz = (saat: number) => `${String(saat).padStart(2, "0")}:00`;

// Gri kutuda saat yaziyorsa uzman musaittir. Kutu yoksa musait degildir veya gorusmesi vardir;
// danisan bu ikisini ayirt edemez. uzmanId yoksa takvim yalnizca gosterim icindir.
export function Takvim({
  saatler,
  simdi,
  uzmanId,
  ogrenci,
  ciddiDurumlar,
  children,
}: {
  saatler: string[];
  simdi: string;
  uzmanId: string | null;
  ogrenci: boolean;
  ciddiDurumlar: string[];
  children?: ReactNode;
}) {
  const [hafta, setHafta] = useState(0);
  const [secili, setSecili] = useState<string | null>(null);

  const gunler = haftaGunleri(hafta, new Date(simdi));
  const musait = new Set(saatler);
  const parcalar = saatler.map(saatParcalari);
  const haftadakiSaatler = [
    ...new Set(parcalar.filter((p) => gunler.some((g) => g.tarih === p.tarih)).map((p) => p.saat)),
  ].sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid min-w-[30rem] grid-cols-7 gap-1 text-center text-xs">
          {gunler.map((g) => (
            <div key={g.tarih} className="py-1 font-semibold leading-tight text-slate-600">
              {g.etiket.slice(0, 3)}
              <br />
              {g.etiket.slice(4)}
            </div>
          ))}
          {haftadakiSaatler.map((saat) => (
            <div key={saat} className="contents">
              {gunler.map((g) => {
                const iso = saatIso(g.tarih, saat);
                if (!musait.has(iso)) return <div key={iso} />;
                if (!uzmanId) {
                  return (
                    <div key={iso} className="rounded-md bg-slate-100 py-2 text-slate-700">
                      {saatYaz(saat)}
                    </div>
                  );
                }
                const seciliMi = secili === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    aria-pressed={seciliMi}
                    aria-label={saatEtiketi(iso)}
                    onClick={() => setSecili(seciliMi ? null : iso)}
                    className={`min-h-9 rounded-md py-2 ${
                      seciliMi ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {saatYaz(saat)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {haftadakiSaatler.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-600">Bu hafta uygun saat görünmüyor.</p>
        )}
        <div className="mt-2 flex justify-between text-sm">
          <button
            type="button"
            disabled={hafta === 0}
            onClick={() => setHafta(hafta - 1)}
            className="text-teal-800 hover:underline disabled:text-slate-500 disabled:no-underline"
          >
            ‹ Önceki hafta
          </button>
          <button
            type="button"
            disabled={hafta === GORUNEN_HAFTA}
            onClick={() => setHafta(hafta + 1)}
            className="text-teal-800 hover:underline disabled:text-slate-500 disabled:no-underline"
          >
            Sonraki hafta ›
          </button>
        </div>
      </div>
      {uzmanId ? <BasvuruFormu uzmanId={uzmanId} secili={secili} ogrenci={ogrenci} ciddiDurumlar={ciddiDurumlar} /> : children}
    </div>
  );
}
