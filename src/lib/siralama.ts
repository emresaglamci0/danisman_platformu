// Esit rekabet: puansizlar rastgele; puanlilar agirlikli ortalamayla (Bayes).
import { karistir } from "./karistir.ts";

export const PUAN_ONCEL_AGIRLIK = 5;
export const PUAN_ONCEL_ORTALAMA = 3.5;
export const PUAN_ALT_SINIR = 2.5;

export type PuanOzeti = { kind: "independent" | "student"; puan_ortalama: number | null; puan_sayisi: number };

export function agirlikliPuan(ortalama: number, sayi: number): number {
  return (PUAN_ONCEL_AGIRLIK * PUAN_ONCEL_ORTALAMA + sayi * ortalama) / (PUAN_ONCEL_AGIRLIK + sayi);
}

export function puanaGoreSirala<T extends PuanOzeti>(liste: readonly T[], rastgele: () => number = Math.random): T[] {
  const ust: T[] = [];
  const orta: T[] = [];
  const alt: T[] = [];
  for (const x of liste) {
    if (x.kind === "student" || x.puan_sayisi === 0 || x.puan_ortalama === null) orta.push(x);
    else if (agirlikliPuan(x.puan_ortalama, x.puan_sayisi) >= PUAN_ALT_SINIR) ust.push(x);
    else alt.push(x);
  }
  // Once karistir, sonra kararli sort: esit puanlilarin sirasi rastgele kalir.
  const puanla = (bolum: T[]) =>
    karistir(bolum, rastgele).sort(
      (a, c) => agirlikliPuan(c.puan_ortalama!, c.puan_sayisi) - agirlikliPuan(a.puan_ortalama!, a.puan_sayisi),
    );
  return [...puanla(ust), ...karistir(orta, rastgele), ...puanla(alt)];
}

// En yakin 0,5'e yuvarlar.
export function yildizYuvarla(ortalama: number): number {
  return Math.round(ortalama * 2) / 2;
}
