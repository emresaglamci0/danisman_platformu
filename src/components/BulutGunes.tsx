// Uzman profilinde takvimin altindaki suslu cizim: yavasca donen gunes ve hafifce kayan bulut.
// Yalnizca susleme oldugu icin ekran okuyuculardan gizlenir. Animasyonlar globals.css icindedir.
export function BulutGunes() {
  return (
    <svg viewBox="0 0 160 90" aria-hidden="true" className="bulut-gunes mx-auto w-40">
      <g className="gunes stroke-amber-300" strokeWidth={4} strokeLinecap="round">
        <path d="M62 8V16M62 68V76M28 42H36M88 42H96M38 18L44 24M80 60L86 66M86 18L80 24M44 60L38 66" />
        <circle cx="62" cy="42" r="18" className="fill-amber-100" />
      </g>
      <path
        className="bulut fill-white stroke-teal-700"
        strokeWidth={3}
        strokeLinejoin="round"
        d="M54 80a15 15 0 0 1 1-30 22 22 0 0 1 42-5 18 18 0 0 1 25 17 14 14 0 0 1-4 18z"
      />
    </svg>
  );
}
