"use client";

import { useId, useState } from "react";

const YOL = "M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z";
const ANLAMLAR = ["Hiç memnun değilim", "Memnun değilim", "Orta", "Memnunum", "Çok memnunum"];

export function PuanSecici({ ad, baslangic }: { ad: string; baslangic?: number | null }) {
  const onek = useId();
  const [secili, setSecili] = useState<number>(baslangic ?? 0);
  const [uzerinde, setUzerinde] = useState<number | null>(null);
  const gosterilen = uzerinde ?? secili;

  return (
    <fieldset className="puan-secici" onMouseLeave={() => setUzerinde(null)}>
      <legend className="sr-only">Puan seçin</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="contents">
            <input
              type="radio"
              id={`${onek}-${n}`}
              name={ad}
              value={n}
              checked={secili === n}
              onChange={() => {
                setSecili(n);
                setUzerinde(null);
              }}
              className="sr-only"
            />
            <label htmlFor={`${onek}-${n}`} onMouseEnter={() => setUzerinde(n)} className="cursor-pointer p-0.5">
              <span className="sr-only">{n} · {ANLAMLAR[n - 1]}</span>
              <svg viewBox="0 0 20 20" width={36} height={36} style={{ overflow: "visible" }} aria-hidden="true">
                <path
                  d={YOL}
                  fill={n <= gosterilen ? "#F5B82E" : "#FFFFFF"}
                  stroke="#9A6B00"
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                />
              </svg>
            </label>
          </span>
        ))}
      </div>
      <p aria-live="polite" className="mt-1 min-h-5 text-sm text-slate-700">
        {gosterilen > 0 ? `${gosterilen} · ${ANLAMLAR[gosterilen - 1]}` : ""}
      </p>
    </fieldset>
  );
}
