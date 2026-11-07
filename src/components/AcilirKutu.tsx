import type { ReactNode } from "react";

// Fareli ekranlarda yalnizca baslik gorunur; fare ustune gelince ya da klavyeyle odaklaninca
// cizim ve metin kayarak acilir. Telefonda (hover yok) hep aciktir. Metin her zaman sayfadadir,
// ekran okuyucu kapali gorunse de okur. Kurallar globals.css icindedir (.acilir-kutu).
export function AcilirKutu({
  baslik,
  cizim,
  children,
}: {
  baslik: string;
  cizim: ReactNode;
  children: ReactNode;
}) {
  return (
    <div tabIndex={0} className="acilir-kutu rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center justify-between gap-2 font-semibold text-slate-900">
        {baslik}
        <span aria-hidden="true" className="acilir-ok text-slate-600">
          ⌄
        </span>
      </h3>
      <div className="acilir-icerik">
        <div>
          {cizim}
          <div className="mt-2 space-y-2 text-sm text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}
