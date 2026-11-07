import type { ReactNode } from "react";

// Ana sayfadaki "nasil calisir" adimlarinin cizimleri. Yalnizca susleme olduklari icin
// ekran okuyuculardan gizlenir.
function Cerceve({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="w-16 shrink-0 stroke-slate-900 lg:w-20"
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {children}
    </svg>
  );
}

export function UzmanlarGorseli() {
  return (
    <Cerceve>
      <circle cx="22" cy="46" r="10" className="fill-amber-200" />
      <path d="M6 84 C 6 62, 38 62, 38 84 Z" className="fill-teal-200" />
      <circle cx="78" cy="46" r="10" className="fill-amber-200" />
      <path d="M62 84 C 62 62, 94 62, 94 84 Z" className="fill-teal-200" />
      <path d="M26 88 C 26 60, 74 60, 74 88 Z" className="fill-teal-700" />
      <circle cx="50" cy="38" r="14" className="fill-amber-200" />
      <path d="M36 38 C 34 16, 66 16, 64 38 C 58 28, 42 28, 36 38 Z" className="fill-amber-700" />
      <circle cx="78" cy="22" r="13" className="fill-teal-100" />
      <path d="M72 22 L 77 27 L 85 17" className="fill-none" />
    </Cerceve>
  );
}

export function BasvuruGorseli() {
  return (
    <Cerceve>
      <path d="M8 50 L 92 14 L 66 86 L 46 60 Z" className="fill-teal-100" />
      <path d="M92 14 L 46 60 L 44 80 L 56 70" className="fill-teal-200" />
      <path d="M8 74 L 20 68 M10 90 L 30 80" className="fill-none" />
    </Cerceve>
  );
}

export function YanitGorseli() {
  return (
    <Cerceve>
      <path
        d="M14 20 H 86 Q 92 20 92 26 V 62 Q 92 68 86 68 H 44 L 28 86 V 68 H 14 Q 8 68 8 62 V 26 Q 8 20 14 20 Z"
        className="fill-amber-100"
      />
      <circle cx="32" cy="44" r="5" className="fill-teal-700" />
      <circle cx="50" cy="44" r="5" className="fill-teal-700" />
      <circle cx="68" cy="44" r="5" className="fill-teal-700" />
    </Cerceve>
  );
}
