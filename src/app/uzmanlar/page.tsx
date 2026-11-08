import Link from "next/link";
import { UzmanKarti } from "@/components/UzmanKarti";
import { girdiSinifi } from "@/components/FormParcalari";
import { ALANLAR, listedeMi, type Alan } from "@/lib/sabitler";
import { onayliUzmanlar, type Uzman } from "@/lib/uzmanlar";

export const metadata = { title: "Uzmanlar | Danışman Buluşma" };

const FILTRELER: { deger?: Uzman["kind"]; ad: string }[] = [
  { ad: "Tümü" },
  { deger: "independent", ad: "Uzmanlar" },
  { deger: "student", ad: "Stajyer öğrenciler (ücretsiz)" },
];

const ALAN_FILTRELERI: { deger?: Alan; ad: string }[] = [
  { ad: "Tüm konular" },
  ...(Object.keys(ALANLAR) as Alan[]).map((deger) => ({ deger, ad: ALANLAR[deger] })),
];

function filtreSinifi(secili: boolean) {
  return `rounded-full border px-3 py-1 ${
    secili ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white hover:bg-slate-50"
  }`;
}

export default async function UzmanlarSayfasi({ searchParams }: PageProps<"/uzmanlar">) {
  const { tur, alan, ara } = await searchParams;
  const secili = tur === "independent" || tur === "student" ? tur : undefined;
  const seciliAlan = listedeMi(ALANLAR, alan) ? alan : undefined;
  const aranan = typeof ara === "string" ? ara.trim().slice(0, 80) : "";
  const uzmanlar = await onayliUzmanlar({ tur: secili, alan: seciliAlan, ara: aranan });

  // Bir filtre degisirken digerleri korunur
  const adres = (degisen: { tur?: string; alan?: string; ara?: string }) => {
    const parametreler = Object.entries({ tur: secili, alan: seciliAlan, ara: aranan, ...degisen }).filter(
      (parametre): parametre is [string, string] => !!parametre[1],
    );
    return parametreler.length ? `/uzmanlar?${new URLSearchParams(parametreler)}` : "/uzmanlar";
  };

  const filtreler = (
    <div className="space-y-3">
      <nav aria-label="Uzman türü" className="flex flex-wrap gap-2 text-sm">
        {FILTRELER.map((filtre) => (
          <Link key={filtre.ad} href={adres({ tur: filtre.deger })} className={filtreSinifi(secili === filtre.deger)}>
            {filtre.ad}
          </Link>
        ))}
      </nav>

      <nav aria-label="Konu" className="flex flex-wrap gap-2 text-sm">
        {ALAN_FILTRELERI.map((filtre) => (
          <Link
            key={filtre.ad}
            href={adres({ alan: filtre.deger })}
            className={filtreSinifi(seciliAlan === filtre.deger)}
          >
            {filtre.ad}
          </Link>
        ))}
      </nav>
    </div>
  );
  const filtreSayisi = [secili, seciliAlan].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Uzmanlar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Burada yalnızca belgeleri yönetici tarafından kontrol edilip onaylanmış kişiler listelenir.
        </p>
      </div>

      <form action="/uzmanlar" role="search" className="flex max-w-md items-end gap-2">
        {secili && <input type="hidden" name="tur" value={secili} />}
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
              <p>Bu alanda henüz uzman yok.</p>
              <Link
                href={adres({ alan: undefined, ara: undefined })}
                className="mt-2 inline-block font-medium text-teal-700 underline"
              >
                {secili === "independent" ? "Tüm bağımsız uzmanları gör" : "Tüm uzmanları gör"}
              </Link>
            </>
          ) : (
            <p>
              {secili || aranan ? "Bu seçimlere uyan uzman bulunamadı." : "Şu an listelenecek onaylı uzman yok."}
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
