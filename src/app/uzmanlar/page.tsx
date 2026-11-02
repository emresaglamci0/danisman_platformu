import Link from "next/link";
import { UzmanKarti } from "@/components/UzmanKarti";
import { onayliUzmanlar, type Uzman } from "@/lib/uzmanlar";

export const metadata = { title: "Uzmanlar | Danışman Buluşma" };

const FILTRELER: { deger?: Uzman["kind"]; ad: string }[] = [
  { ad: "Tümü" },
  { deger: "independent", ad: "Uzmanlar" },
  { deger: "student", ad: "Stajyer öğrenciler (ücretsiz)" },
];

export default async function UzmanlarSayfasi({ searchParams }: PageProps<"/uzmanlar">) {
  const { tur } = await searchParams;
  const secili = tur === "independent" || tur === "student" ? tur : undefined;
  const uzmanlar = await onayliUzmanlar(secili);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Uzmanlar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Burada yalnızca belgeleri yönetici tarafından kontrol edilip onaylanmış kişiler listelenir.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {FILTRELER.map((filtre) => (
          <Link
            key={filtre.ad}
            href={filtre.deger ? `/uzmanlar?tur=${filtre.deger}` : "/uzmanlar"}
            className={`rounded-full border px-3 py-1 ${
              secili === filtre.deger
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            {filtre.ad}
          </Link>
        ))}
      </nav>

      {uzmanlar.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Şu an listelenecek onaylı uzman yok.
        </p>
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
