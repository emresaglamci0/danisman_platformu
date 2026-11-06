"use client";

import { useState } from "react";

export function RahatsizlikKarti({ ad, aciklama }: { ad: string; aciklama: string }) {
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
          <p className="px-4 pb-4 text-sm text-slate-600">{aciklama}</p>
        </div>
      </div>
    </li>
  );
}
