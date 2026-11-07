import { Uzuv } from "@/components/OturanKadin";

// Ana sayfa cizimi: bilgisayar basinda online gorusme yapan psikolog. Yalnizca susleme oldugu
// icin ekran okuyuculardan gizlenir. Animasyonlar globals.css icindedir.
export function OnlineGorusme() {
  return (
    <svg
      viewBox="0 0 320 225"
      aria-hidden="true"
      className="online-gorusme mx-auto w-60 shrink-0 stroke-slate-900 sm:mx-0 lg:w-72"
      strokeWidth={4}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse cx="160" cy="214" rx="150" ry="9" className="fill-teal-100 stroke-none" />

      <rect x="46" y="108" width="12" height="68" rx="5" className="fill-amber-300" />
      <rect x="50" y="172" width="78" height="9" rx="4" className="fill-amber-300" />
      <path d="M88 181 L 88 210 M68 212 L 108 212" className="fill-none" />

      <Uzuv d="M95 170 C 120 168, 146 172, 148 190 L 148 206" />
      <ellipse cx="156" cy="209" rx="14" ry="6" className="fill-teal-800" />
      <path d="M64 174 C 58 122, 78 100, 98 100 C 118 100, 128 124, 126 174 Z" className="fill-teal-700" />

      <rect x="135" y="170" width="170" height="10" rx="4" className="fill-amber-300" />
      <path d="M172 180 L 172 212 M292 180 L 292 212" className="fill-none" />

      <path d="M222 150 L 222 170 M238 150 L 238 170" className="fill-none" />
      <rect x="170" y="70" width="120" height="82" rx="8" className="fill-slate-800" />
      <rect x="178" y="78" width="104" height="66" rx="3" className="fill-teal-100 stroke-none" />
      <path d="M204 144 C 204 120, 256 120, 256 144 Z" className="fill-amber-300" strokeWidth={3} />
      <g className="ekran-bas" strokeWidth={3}>
        <circle cx="230" cy="104" r="14" className="fill-amber-200" />
        <path d="M216 104 C 214 84, 246 84, 244 104 C 238 95, 222 95, 216 104 Z" className="fill-amber-700" />
        <circle cx="225" cy="106" r="1.8" className="fill-slate-900 stroke-none" />
        <circle cx="235" cy="106" r="1.8" className="fill-slate-900 stroke-none" />
      </g>

      <rect x="148" y="163" width="52" height="7" rx="2" className="fill-slate-200" />
      <Uzuv d="M100 126 C 112 150, 136 158, 160 158" />

      <g className="psikolog-bas">
        <ellipse cx="96" cy="72" rx="26" ry="28" className="fill-amber-200" />
        <path
          d="M70 74 C 64 36, 122 32, 122 60 C 106 50, 90 54, 84 78 C 82 92, 72 92, 70 74 Z"
          className="fill-slate-800"
        />
        <circle cx="98" cy="72" r="2.8" className="fill-slate-900 stroke-none" />
        <circle cx="113" cy="72" r="2.8" className="fill-slate-900 stroke-none" />
        <circle cx="98" cy="72" r="7" className="fill-none" strokeWidth={2.5} />
        <circle cx="113" cy="72" r="7" className="fill-none" strokeWidth={2.5} />
        <path d="M100 87 Q 106 92 112 87" className="fill-none" strokeWidth={3} />
      </g>
    </svg>
  );
}
