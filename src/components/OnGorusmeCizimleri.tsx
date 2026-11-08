import type { ReactNode } from "react";
import { Uzuv } from "@/components/OturanKadin";

// On gorusme sayfasindaki kutu cizimleri. Yalnizca susleme oldugu icin ekran okuyuculardan gizlenir.
function KutuCizimi({ genis, children }: { genis?: boolean; children: ReactNode }) {
  return (
    <svg
      viewBox={genis ? "0 0 280 80" : "0 0 120 80"}
      aria-hidden="true"
      className={`mx-auto mt-4 block stroke-slate-900 ${genis ? "w-64" : "w-28"}`}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx={genis ? 140 : 60} cy="74" rx={genis ? 130 : 52} ry="4" className="fill-teal-100 stroke-none" />
      {children}
    </svg>
  );
}

export function TanismaCizimi() {
  return (
    <KutuCizimi>
      <circle cx="38" cy="30" r="12" className="fill-amber-200" />
      <path d="M22 70 C22 48 54 48 54 70Z" className="fill-teal-700" />
      <circle cx="82" cy="30" r="12" className="fill-amber-200" />
      <path d="M66 70 C66 48 98 48 98 70Z" className="fill-amber-300" />
      <path d="M60 10 C56 4 48 8 54 14 L60 20 L66 14 C72 8 64 4 60 10Z" className="fill-amber-300" />
    </KutuCizimi>
  );
}

export function SoruCizimi() {
  return (
    <KutuCizimi>
      <path
        d="M18 12 H72 a6 6 0 0 1 6 6 V40 a6 6 0 0 1-6 6 H38 L28 56 V46 H18 a6 6 0 0 1-6-6 V18 a6 6 0 0 1 6-6Z"
        className="fill-amber-100"
      />
      <path d="M38 24 C38 16 52 16 52 24 C52 30 45 30 45 35" className="fill-none" />
      <circle cx="45" cy="40" r="1.5" className="fill-slate-900" />
      <path
        d="M70 34 H104 a5 5 0 0 1 5 5 V56 a5 5 0 0 1-5 5 H100 V69 L92 61 H70 a5 5 0 0 1-5-5 V39 a5 5 0 0 1 5-5Z"
        className="fill-teal-100"
      />
      <path d="M76 44 H98 M76 52 H92" className="fill-none" />
    </KutuCizimi>
  );
}

export function KararCizimi() {
  return (
    <KutuCizimi>
      <path d="M60 14 V72" className="fill-none" />
      <path d="M60 18 H94 L102 26 L94 34 H60Z" className="fill-teal-700" />
      <path d="M60 40 H26 L18 48 L26 56 H60Z" className="fill-amber-100" />
    </KutuCizimi>
  );
}

// Uc adim: takvimde secilen saat, uzmanin onayi, sohbet ve goruntulu gorusme.
export function NasilCizimi() {
  return (
    <KutuCizimi genis>
      <rect x="12" y="14" width="64" height="54" rx="6" className="fill-white" />
      <path d="M12 20 a6 6 0 0 1 6-6 H70 a6 6 0 0 1 6 6 V28 H12Z" className="fill-teal-700" />
      <rect x="20" y="36" width="12" height="10" rx="2" className="fill-slate-100" strokeWidth={2} />
      <rect x="38" y="36" width="12" height="10" rx="2" className="fill-amber-300" strokeWidth={2} />
      <rect x="56" y="36" width="12" height="10" rx="2" className="fill-slate-100" strokeWidth={2} />
      <rect x="20" y="52" width="12" height="10" rx="2" className="fill-slate-100" strokeWidth={2} />
      <rect x="38" y="52" width="12" height="10" rx="2" className="fill-slate-100" strokeWidth={2} />
      <path d="M88 41 H110 M104 35 L110 41 L104 47" className="fill-none" />
      <circle cx="140" cy="41" r="16" className="fill-teal-100" />
      <path d="M132 41 L138 47 L149 35" className="fill-none" />
      <path d="M168 41 H190 M184 35 L190 41 L184 47" className="fill-none" />
      <path
        d="M206 16 H244 a6 6 0 0 1 6 6 V40 a6 6 0 0 1-6 6 H222 L212 56 V46 H206 a6 6 0 0 1-6-6 V22 a6 6 0 0 1 6-6Z"
        className="fill-amber-100"
      />
      <path d="M210 26 H238 M210 34 H230" className="fill-none" />
      <rect x="234" y="44" width="26" height="18" rx="3" className="fill-teal-700" />
      <path d="M260 49 L272 43 V63 L260 57Z" className="fill-teal-700" />
    </KutuCizimi>
  );
}

// Sayfa alti seridi: tepede meditasyon yapan kadin, ufukta yavasca donen gunes.
// Animasyonlar globals.css icindedir (.meditasyon-seridi).
export function MeditasyonSeridi() {
  return (
    <svg
      viewBox="0 0 640 230"
      aria-hidden="true"
      className="meditasyon-seridi block w-full stroke-slate-900"
      strokeWidth={4}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <g className="meditasyon-gunes stroke-amber-300" strokeWidth={5}>
        <path d="M450 40V62M450 258V280M330 160H352M548 160H570M365 75L381 91M519 229L535 245M535 75L519 91M381 229L365 245" />
      </g>
      <circle cx="450" cy="160" r="80" className="fill-amber-100 stroke-none" />
      <path d="M0 190 C160 160,480 160,640 190 V230 H0Z" className="fill-teal-100 stroke-none" />

      <g transform="translate(225 60) scale(0.58)">
        <g className="meditasyon-nefes">
          <path
            d="M118 110 C116 60,204 60,202 110 C206 140,208 165,200 178 L120 178 C112 165,114 140,118 110Z"
            className="fill-amber-700"
          />
          <path d="M132 158 Q160 148 188 158 L206 246 Q160 258 114 246Z" className="fill-teal-700" />
          <ellipse cx="160" cy="112" rx="38" ry="36" className="fill-amber-200" />
          <path d="M118 110 C116 60,204 60,202 110 C186 88,140 86,118 110Z" className="fill-amber-700" />
          <path d="M140 112 Q147 118 154 112 M166 112 Q173 118 180 112" className="fill-none" strokeWidth={3} />
          <path d="M153 128 Q160 133 167 128" className="fill-none" strokeWidth={3} />
        </g>
        <Uzuv d="M140 240 C100 232,72 244,84 256 C96 266,140 262,178 262" />
        <Uzuv d="M180 240 C220 232,248 244,236 256 C224 266,180 262,142 262" />
        <Uzuv d="M138 168 C118 190,100 214,90 238" />
        <Uzuv d="M182 168 C202 190,220 214,230 238" />
      </g>
    </svg>
  );
}

// Grup seanslari sayfasi seridi: tepede yan yana oturan bes kisi, ustlerinde suzulen kalp.
// Kisiler iki farkli hizda nefes alir. Animasyonlar globals.css icindedir (.grup-seridi).
const GRUP_KISILERI = [
  { x: 130, y: 112, govde: "fill-amber-300" },
  { x: 225, y: 100, govde: "fill-teal-700" },
  { x: 320, y: 95, govde: "fill-amber-700" },
  { x: 415, y: 100, govde: "fill-teal-700" },
  { x: 510, y: 112, govde: "fill-amber-300" },
];

export function GrupSeridi() {
  return (
    <svg
      viewBox="0 0 640 200"
      aria-hidden="true"
      className="grup-seridi block w-full stroke-slate-900"
      strokeWidth={4}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M0 170 C160 140,480 140,640 170 V200 H0Z" className="fill-teal-100 stroke-none" />
      {GRUP_KISILERI.map((k, i) => (
        <g key={k.x} className={i % 2 ? "grup-nefes-yavas" : "grup-nefes"}>
          <path d={`M${k.x - 30} 166 C${k.x - 30} ${k.y + 22},${k.x + 30} ${k.y + 22},${k.x + 30} 166Z`} className={k.govde} />
          <circle cx={k.x} cy={k.y} r="20" className="fill-amber-200" />
          <path d={`M${k.x - 8} ${k.y + 6} Q${k.x} ${k.y + 11} ${k.x + 8} ${k.y + 6}`} className="fill-none" strokeWidth={3} />
        </g>
      ))}
      <path
        className="grup-kalp fill-amber-300"
        d="M320 40 C314 30 300 34 306 46 L320 60 L334 46 C340 34 326 30 320 40Z"
      />
    </svg>
  );
}
