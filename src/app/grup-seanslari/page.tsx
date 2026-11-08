import Link from "next/link";
import { GrupSeridi } from "@/components/OnGorusmeCizimleri";
import { OnayGerekir } from "@/components/OnayGerekir";
import { acikGruplar, GRUP_EN_AZ, GRUP_EN_FAZLA } from "@/lib/gruplar";
import { ALANLAR, paraYaz } from "@/lib/sabitler";
import { saatEtiketi } from "@/lib/seans-kurallari";

export const metadata = { title: "Grup Seansları | Danışman Buluşma" };

export default async function GrupSeanslariSayfasi() {
  const gruplar = await acikGruplar();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grup Seansları</h1>
        <p className="mt-1 text-slate-600">
          Bağımsız uzmanların açtığı grupla psikolojik danışma seansları. Her grup en az {GRUP_EN_AZ}, en fazla{" "}
          {GRUP_EN_FAZLA} kişiyle yapılır. Seansa 12 saat kala {GRUP_EN_AZ} kişi olmazsa seans iptal edilir ve ödemeler
          iade sayılır. <OnayGerekir />
        </p>
      </div>

      {gruplar.length === 0 && <p className="text-sm text-slate-600">Şu anda açık grup seansı yok.</p>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {gruplar.map((g) => (
          <li key={g.id}>
            <Link
              href={`/grup-seanslari/${g.id}`}
              className="block h-full space-y-2 rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-700"
            >
              <p className="font-semibold">{ALANLAR[g.topic]}</p>
              <p className="line-clamp-3 text-sm text-slate-700">{g.purpose}</p>
              <p className="text-sm text-teal-800">{g.display_name}</p>
              <p className="text-sm text-slate-600">
                {saatEtiketi(g.starts_at)} · {paraYaz(g.price_kurus)} · Kalan yer: {GRUP_EN_FAZLA - g.katilimci}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <GrupSeridi />
    </div>
  );
}
