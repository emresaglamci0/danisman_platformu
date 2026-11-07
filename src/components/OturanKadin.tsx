// Ana sayfa cizimi: yerde oturan kadin ve basinin ustunde kelebek. Yalnizca susleme oldugu icin
// ekran okuyuculardan gizlenir. Animasyonlar globals.css icindedir.
function Uzuv({ d }: { d: string }) {
  return (
    <>
      <path d={d} className="fill-none stroke-slate-900" strokeWidth={15} strokeLinecap="round" />
      <path d={d} className="fill-none stroke-amber-200" strokeWidth={8} strokeLinecap="round" />
    </>
  );
}

export function OturanKadin() {
  return (
    <svg
      viewBox="0 0 320 290"
      aria-hidden="true"
      className="oturan-kadin mx-auto w-64 stroke-slate-900 sm:w-72 lg:w-full lg:max-w-sm"
      strokeWidth={4}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse cx="160" cy="268" rx="135" ry="12" className="fill-teal-100 stroke-none" />

      <Uzuv d="M140 240 C 100 232, 72 244, 84 256 C 96 266, 140 262, 178 262" />
      <Uzuv d="M180 240 C 220 232, 248 244, 236 256 C 224 266, 180 262, 142 262" />
      <ellipse cx="182" cy="262" rx="13" ry="8" className="fill-teal-800" />
      <ellipse cx="138" cy="262" rx="13" ry="8" className="fill-teal-800" />

      <g className="kadin-govde">
        <g className="kadin-bas">
          <path
            d="M118 110 C 116 60, 204 60, 202 110 C 206 140, 208 165, 200 178 L 120 178 C 112 165, 114 140, 118 110 Z"
            className="fill-amber-700"
          />
        </g>

        <path d="M132 158 Q 160 148 188 158 L 206 246 Q 160 258 114 246 Z" className="fill-teal-700" />
        <Uzuv d="M138 168 C 122 188, 108 208, 98 236" />
        <Uzuv d="M182 168 C 198 188, 212 208, 222 236" />

        <g className="kadin-bas">
          <ellipse cx="160" cy="112" rx="38" ry="36" className="fill-amber-200" />
          <path d="M118 110 C 116 60, 204 60, 202 110 C 186 88, 140 86, 118 110 Z" className="fill-amber-700" />
          <ellipse cx="136" cy="125" rx="7" ry="4" className="fill-amber-300 stroke-none" />
          <ellipse cx="184" cy="125" rx="7" ry="4" className="fill-amber-300 stroke-none" />
          <circle cx="147" cy="112" r="3.5" className="fill-slate-900 stroke-none" />
          <circle cx="173" cy="112" r="3.5" className="fill-slate-900 stroke-none" />
          <path d="M153 127 Q 160 134 167 127" className="fill-none" strokeWidth={3} />
        </g>
      </g>

      <g className="kelebek">
        <g className="kelebek-kanat fill-amber-300" strokeWidth={3}>
          <path d="M172 38 C 160 18, 140 20, 144 36 C 146 44, 162 44, 172 38 Z" />
          <path d="M172 40 C 160 44, 150 50, 156 58 C 162 62, 170 52, 172 40 Z" />
          <path d="M172 38 C 184 18, 204 20, 200 36 C 198 44, 182 44, 172 38 Z" />
          <path d="M172 40 C 184 44, 194 50, 188 58 C 182 62, 174 52, 172 40 Z" />
        </g>
        <path d="M172 30 L 172 50" />
        <path d="M172 30 Q 166 20 161 22 M172 30 Q 178 20 183 22" className="fill-none" strokeWidth={2} />
      </g>
    </svg>
  );
}
