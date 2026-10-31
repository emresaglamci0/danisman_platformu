import Link from "next/link";
import { ALANLAR } from "@/lib/sabitler";
import { uzmanUnvani, type Uzman } from "@/lib/uzmanlar";

export function UzmanKarti({ uzman }: { uzman: Uzman }) {
  return (
    <Link
      href={`/uzmanlar/${uzman.id}`}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold">{uzman.display_name}</h2>
        {uzman.kind === "student" && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            Stajyer
          </span>
        )}
      </div>
      <p className="text-sm text-teal-800">{uzmanUnvani(uzman)}</p>
      {uzman.bio && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{uzman.bio}</p>}
      <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {uzman.specialties.map((alan) => (
          <li key={alan} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {ALANLAR[alan] ?? alan}
          </li>
        ))}
      </ul>
    </Link>
  );
}
