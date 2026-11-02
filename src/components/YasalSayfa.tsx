import { TaslakNotu } from "@/components/kvkk/TaslakNotu";

// Kullanim kosullari, gizlilik, cerez, hakkimizda gibi metin sayfalarinin ortak cercevesi.
// Metni degistirdiginizde "guncelleme" tarihini de degistirin.
export function YasalSayfa({
  baslik,
  guncelleme,
  children,
}: {
  baslik: string;
  guncelleme: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{baslik}</h1>
        <p className="text-xs text-slate-500">Son güncelleme: {guncelleme}</p>
        <TaslakNotu />
      </div>
      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </div>
  );
}

export function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-slate-900">{baslik}</h2>
      {children}
    </section>
  );
}

export const listeSinifi = "list-disc space-y-1 pl-5";
