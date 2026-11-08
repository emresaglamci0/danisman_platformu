import { useId } from "react";
import { yildizYuvarla } from "@/lib/siralama";

const YOL = "M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z";

// Salt gosterim: etkilesimli oge yok (UzmanKarti bir baglanti).
export function Yildizlar({ ortalama, sayi, boyut = 20 }: { ortalama: number; sayi: number; boyut?: number }) {
  const id = useId();
  const yuvarlak = yildizYuvarla(ortalama);
  const metin = ortalama.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <p className="flex items-center gap-2 text-sm text-slate-700">
      <span className="yildizlar" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => {
          const dolgu = yuvarlak >= n ? "#F5B82E" : yuvarlak >= n - 0.5 ? `url(#${id}-yarim)` : "#FFFFFF";
          return (
            <svg key={n} className="y" viewBox="0 0 20 20" width={boyut} height={boyut} style={{ overflow: "visible" }}>
              {n === 1 && (
                <defs>
                  <linearGradient id={`${id}-yarim`}>
                    <stop offset="50%" stopColor="#F5B82E" />
                    <stop offset="50%" stopColor="#FFFFFF" />
                  </linearGradient>
                </defs>
              )}
              <path d={YOL} fill={dolgu} stroke="#9A6B00" strokeWidth={1.4} strokeLinejoin="round" />
            </svg>
          );
        })}
      </span>
      <span aria-hidden="true">
        <b>{metin}</b> ({sayi} değerlendirme)
      </span>
      <span className="sr-only">
        5 üzerinden {metin}, {sayi} değerlendirme
      </span>
    </p>
  );
}
