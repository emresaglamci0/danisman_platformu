import { Uzuv } from "@/components/OturanKadin";

// "Neler yasiyorsun?" yaninda duran dusunen psikolog cizimi. Yalnizca susleme oldugu icin
// ekran okuyuculardan gizlenir. ampul: en az bir his secilince soru isareti yerine ampul gorunur.
// Animasyonlar globals.css icindedir.
export function PsikologCizimi({ ampul }: { ampul: boolean }) {
  return (
    <svg
      viewBox="0 0 240 270"
      aria-hidden="true"
      className="psikolog-cizim mx-auto w-24 stroke-slate-900 sm:w-32"
      strokeWidth={4}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse cx="110" cy="256" rx="90" ry="10" className="fill-teal-100 stroke-none" />

      <g className="psikolog-cizim-govde">
        <path d="M84 166 Q 110 156 136 166 L 152 248 Q 110 258 68 248 Z" className="fill-teal-700" />
        {/* Cenesine giden kol ve onu tasiyan diger kol */}
        <Uzuv d="M86 174 C 70 200, 90 222, 138 214" />
        <Uzuv d="M136 172 C 160 200, 150 206, 126 138" />

        <g className="psikolog-cizim-bas">
          <ellipse cx="110" cy="104" rx="36" ry="34" className="fill-amber-200" />
          <path d="M74 102 C 72 56, 148 56, 146 102 C 132 82, 92 80, 74 102 Z" className="fill-amber-700" />
          <ellipse cx="90" cy="116" rx="7" ry="4" className="fill-amber-300 stroke-none" />
          <ellipse cx="130" cy="116" rx="7" ry="4" className="fill-amber-300 stroke-none" />
          <circle cx="98" cy="104" r="3.5" className="psikolog-cizim-goz fill-slate-900 stroke-none" />
          <circle cx="122" cy="104" r="3.5" className="psikolog-cizim-goz fill-slate-900 stroke-none" />
          <path d="M104 120 Q 110 124 116 120" className="fill-none" strokeWidth={3} />
          <ellipse cx="128" cy="132" rx="9" ry="8" className="fill-amber-200" />
        </g>
      </g>

      <g className="psikolog-cizim-isaret">
        {ampul ? (
          <g className="psikolog-cizim-ampul">
            <circle cx="184" cy="42" r="15" className="fill-amber-300" />
            <rect x="178" y="56" width="12" height="8" rx="2" className="fill-slate-300" />
            <path d="M184 12 V 20 M162 22 L 168 28 M206 22 L 200 28 M154 42 H 160 M208 42 H 214" className="fill-none" strokeWidth={3} />
          </g>
        ) : (
          <>
            <circle cx="184" cy="40" r="24" className="fill-teal-50" />
            <path d="M175 33 C 175 22, 193 22, 193 33 C 193 40, 184 41, 184 49" className="fill-none" strokeWidth={4} />
            <circle cx="184" cy="57" r="2.5" className="fill-slate-900 stroke-none" />
          </>
        )}
      </g>
    </svg>
  );
}
