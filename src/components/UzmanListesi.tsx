import Link from "next/link";
import type { ReactNode } from "react";
import { UzmanKarti } from "@/components/UzmanKarti";
import { girdiSinifi } from "@/components/FormParcalari";
import { puanaGoreSirala } from "@/lib/siralama";
import { ALANLAR, BOLUMLER, UNVANLAR, listeAlani, listedeMi, ogrenciyeAcik, type Alan } from "@/lib/sabitler";
import { onayliUzmanlar, type Uzman } from "@/lib/uzmanlar";

function filtreSinifi(secili: boolean) {
  return `rounded-full border px-3 py-1 ${
    secili ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white hover:bg-slate-50"
  }`;
}

export async function UzmanListesi({
  tur,
  baslik,
  aciklama,
  arama,
}: {
  tur: Uzman["kind"];
  baslik: string;
  aciklama: ReactNode;
  arama: Record<string, string | string[] | undefined>;
}) {
  const ogrenci = tur === "student";
  const yol = ogrenci ? "/ogrenci-uzmanlar" : "/uzmanlar";
  const sinifAdi = ogrenci ? "bolum" : "unvan";
  const siniflar: Record<string, string> = ogrenci ? BOLUMLER : UNVANLAR;
  const hamSinif = arama[sinifAdi];
  const seciliSinif = listedeMi(siniflar, hamSinif) ? hamSinif : undefined;

  const seciliAlan = listeAlani(tur, arama.alan);
  const aranan = typeof arama.ara === "string" ? arama.ara.trim().slice(0, 80) : "";

  const uzmanlar = puanaGoreSirala(
    await onayliUzmanlar({
      tur,
      alan: seciliAlan,
      ara: aranan,
      unvan: !ogrenci && listedeMi(UNVANLAR, seciliSinif) ? seciliSinif : undefined,
      bolum: ogrenci && listedeMi(BOLUMLER, seciliSinif) ? seciliSinif : undefined,
    }),
  );

  // Bir filtre degisirken digerleri korunur
  const adres = (degisen: { sinif?: string; alan?: string; ara?: string }) => {
    const son = { sinif: seciliSinif, alan: seciliAlan, ara: aranan, ...degisen };
    const parametreler = Object.entries({ [sinifAdi]: son.sinif, alan: son.alan, ara: son.ara }).filter(
      (parametre): parametre is [string, string] => !!parametre[1],
    );
    return parametreler.length ? `${yol}?${new URLSearchParams(parametreler)}` : yol;
  };

  const sinifFiltreleri = [{ deger: undefined as string | undefined, ad: "Tümü" }].concat(
    Object.entries(siniflar).map(([deger, ad]) => ({ deger, ad })),
  );
  const alanFiltreleri = [{ deger: undefined as Alan | undefined, ad: "Tüm konular" }].concat(
    (Object.keys(ALANLAR) as Alan[])
      .filter((deger) => !ogrenci || ogrenciyeAcik(deger))
      .map((deger) => ({ deger, ad: ALANLAR[deger] })),
  );

  const filtreler = (
    <div className="space-y-3">
      <nav aria-label={ogrenci ? "Bölüm" : "Unvan"} className="flex flex-wrap gap-2 text-sm">
        {sinifFiltreleri.map((filtre) => (
          <Link key={filtre.ad} href={adres({ sinif: filtre.deger })} className={filtreSinifi(seciliSinif === filtre.deger)}>
            {filtre.ad}
          </Link>
        ))}
      </nav>

      <nav aria-label="Konu" className="flex flex-wrap gap-2 text-sm">
        {alanFiltreleri.map((filtre) => (
          <Link key={filtre.ad} href={adres({ alan: filtre.deger })} className={filtreSinifi(seciliAlan === filtre.deger)}>
            {filtre.ad}
          </Link>
        ))}
      </nav>
    </div>
  );
  const filtreSayisi = [seciliSinif, seciliAlan].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{baslik}</h1>
        <p className="mt-1 text-sm text-slate-600">{aciklama}</p>
      </div>

      <form action={yol} role="search" className="flex max-w-md items-end gap-2">
        {seciliSinif && <input type="hidden" name={sinifAdi} value={seciliSinif} />}
        {seciliAlan && <input type="hidden" name="alan" value={seciliAlan} />}
        <label className="block flex-1 text-sm font-medium">
          İsimle ara
          <input name="ara" type="search" maxLength={80} defaultValue={aranan} className={girdiSinifi} />
        </label>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Ara
        </button>
      </form>

      {/* Telefonda filtreler uzun yer kapladigi icin acilir panelde durur */}
      <details className="rounded-xl border border-slate-200 bg-white p-3 md:hidden">
        <summary className="cursor-pointer text-sm font-medium">
          Filtreler{filtreSayisi > 0 && ` (${filtreSayisi})`}
        </summary>
        <div className="mt-3">{filtreler}</div>
      </details>
      <div className="hidden md:block">{filtreler}</div>

      {uzmanlar.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          {seciliAlan ? (
            <>
              <p>{ogrenci ? "Bu alanda henüz öğrenci uzman yok." : "Bu alanda henüz uzman yok."}</p>
              <Link
                href={adres({ alan: undefined, ara: undefined })}
                className="mt-2 inline-block font-medium text-teal-700 underline"
              >
                {ogrenci ? "Tüm öğrenci uzmanları gör" : "Tüm uzmanları gör"}
              </Link>
            </>
          ) : (
            <p>
              {seciliSinif || aranan
                ? `Bu seçimlere uyan ${ogrenci ? "öğrenci uzman" : "uzman"} bulunamadı.`
                : `Şu an listelenecek onaylı ${ogrenci ? "öğrenci uzman" : "uzman"} yok.`}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uzmanlar.map((uzman) => (
            <UzmanKarti key={uzman.id} uzman={uzman} />
          ))}
        </div>
      )}
    </div>
  );
}
