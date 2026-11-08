import Link from "next/link";
import { ALANLAR } from "@/lib/sabitler";
import { uzmanUnvani, type Uzman } from "@/lib/uzmanlar";
import { UzmanFotografi } from "./UzmanFotografi";
import { Yildizlar } from "./Yildizlar";

export function UzmanKarti({ uzman, prefetch }: { uzman: Uzman; prefetch?: boolean }) {
  return (
    <Link
      href={`/uzmanlar/${uzman.id}`}
      prefetch={prefetch}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-600 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <UzmanFotografi link={uzman.fotoLink} ad={uzman.display_name} boyut={56} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{uzman.display_name}</h2>
          <p className="text-sm text-teal-800">{uzmanUnvani(uzman)}</p>
          {uzman.kind === "independent" && uzman.puan_sayisi > 0 && uzman.puan_ortalama !== null && (
            <Yildizlar ortalama={uzman.puan_ortalama} sayi={uzman.puan_sayisi} />
          )}
        </div>
      </div>
      {uzman.bio && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{uzman.bio}</p>}
      <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {uzman.specialties.map((alan) => (
          <li key={alan} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {ALANLAR[alan] ?? alan}
          </li>
        ))}
      </ul>
      {uzman.kind === "student" && (
        <p className="mt-3 w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
          Stajyer · Ücretsiz
        </p>
      )}
      {uzman.offers_free_intro && (
        <p className="mt-3 w-fit rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-900">
          Ücretsiz ön görüşme
        </p>
      )}
    </Link>
  );
}
