"use client";

import Link from "next/link";
import { useState } from "react";
import { ALANLAR, type Alan } from "@/lib/sabitler";

export function RahatsizlikKarti({ ad, aciklama, alan }: { ad: string; aciklama: string; alan?: Alan }) {
  const [acik, setAcik] = useState(false);

  return (
    <li className="rounded-xl border border-slate-200 bg-white hover:border-teal-600">
      <h2>
        <button
          type="button"
          aria-expanded={acik}
          onClick={() => setAcik(!acik)}
          className="w-full cursor-pointer rounded-xl p-4 text-left font-semibold"
        >
          {ad}
        </button>
      </h2>
      {/* Yukseklik "auto" degerine gecis yapamaz; 0fr -> 1fr gecisi ayni isi gorur. */}
      <div
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
          acik ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2 px-4 pb-4 text-sm text-slate-600">
            <p>{aciklama}</p>
            <Link href={alan ? `/uzmanlar?alan=${alan}` : "/uzmanlar"} className="inline-block text-teal-800 underline">
              {alan ? `"${ALANLAR[alan]}" alanında çalışan uzmanları gör` : "Uzmanlara göz at"}
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
