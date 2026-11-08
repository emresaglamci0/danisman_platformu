"use client";

import Link from "next/link";
import { useState } from "react";
import { uzmanBaglantisi } from "./kurallar";
import type { Rahatsizlik } from "./veri";

export function RahatsizlikKarti({ r, soluk }: { r: Rahatsizlik; soluk: boolean }) {
  const [acik, setAcik] = useState(false);

  return (
    <li
      className={`rounded-xl border border-slate-200 bg-white transition-opacity hover:border-teal-600 motion-reduce:transition-none ${
        soluk ? "opacity-50" : ""
      }`}
    >
      <h3>
        <button
          type="button"
          aria-expanded={acik}
          onClick={() => setAcik(!acik)}
          className="w-full cursor-pointer rounded-xl p-4 text-left font-semibold focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          {r.ad}
        </button>
      </h3>
      {/* Yukseklik "auto" degerine gecis yapamaz; 0fr -> 1fr gecisi ayni isi gorur. */}
      <div
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
          acik ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 px-4 pb-4 text-sm text-slate-600">
            <p>{r.aciklama}</p>

            <div>
              <p className="font-semibold text-slate-800">Neler hissedilebilir?</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {r.belirtiler.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <details className="rounded-lg border border-slate-300 px-3 py-2">
              <summary className="cursor-pointer font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-teal-700">
                Daha fazla
              </summary>
              <div className="mt-2 space-y-3">
                {r.yayginlik && (
                  <div>
                    <p className="font-semibold text-slate-800">Ne kadar yaygın?</p>
                    <p>{r.yayginlik}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">Neden ortaya çıkar?</p>
                  <p>{r.nedenler}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Nasıl tedavi edilir?</p>
                  <p>{r.tedavi}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Kaynaklar</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {r.kaynaklar.map((k) => (
                      <li key={k.url}>
                        <a href={k.url} target="_blank" rel="noopener noreferrer" className="text-teal-800 underline">
                          {k.ad}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>

            <Link
              href={uzmanBaglantisi(r)}
              className="inline-block rounded-lg bg-teal-700 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Bu alanda çalışan uzmanları gör
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
