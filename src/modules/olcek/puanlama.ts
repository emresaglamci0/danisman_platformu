// Puanlama tamamen tarayicida calisir; girdi ve sonuc hicbir yere gonderilmez.
import type { Alan } from "@/lib/sabitler";
import { karistir } from "../../lib/karistir.ts";
import { MADDELER, type Grup } from "./maddeler.ts";

export type Yanit = 0 | 1 | 2 | 3;
export type Sonuc = { alanlar: Alan[]; psikotik: boolean; ogrenciGizli: boolean; risk: boolean; enUstAlan: Alan };
export type UzmanOzeti = { id: string; kind: "independent" | "student"; display_name: string; specialties: Alan[] };

const GRUPLAR: Grup[] = ["g1", "g2", "g3", "g4", "g5"];

export function degerlendir(yanitlar: Yanit[]): Sonuc {
  if (yanitlar.length !== MADDELER.length) throw new Error("Yanit sayisi madde sayisina esit olmali");
  const ort = (g: Grup) => {
    const idx = MADDELER.flatMap((m, i) => (m.grup === g ? [i] : []));
    return idx.reduce((t, i) => t + yanitlar[i], 0) / idx.length;
  };
  const ortalamalar = GRUPLAR.map((g) => [g, ort(g)] as const);
  const enYuksek = Math.max(...ortalamalar.map(([, o]) => o));
  const psikotik = yanitlar[13] > 0;
  const risk = yanitlar[14] > 0;
  const ogrenciGizli = risk || psikotik || yanitlar[8] >= 2 || yanitlar[9] >= 2;

  // Eslesen maddeler: kazanan gruplarda Hic disi yanitlananlar (+ psikotik)
  let eslesen: number[] = [];
  if (enYuksek >= 1) {
    // en yuksek grup + en fazla bir grup daha (esitlikte onceki grup; sort kararli)
    const [birinci, ...kalan] = [...ortalamalar].sort((a, b) => b[1] - a[1]);
    const ikinci = kalan.find(([, o]) => o >= 1 && enYuksek - o <= 0.5);
    const kazanan = [birinci[0], ...(ikinci ? [ikinci[0]] : [])];
    eslesen = MADDELER.flatMap((m, i) => (kazanan.includes(m.grup as Grup) && yanitlar[i] > 0 ? [i] : []));
  }
  if (psikotik) eslesen.push(13);

  let alanlar: Alan[] = [...new Set(eslesen.flatMap((i) => MADDELER[i].alanlar))];
  if (enYuksek < 1) alanlar = [psikotik ? "psikotik" : "genel"];

  // Esitlikte olcekteki ilk madde kazanir (eslesen artan sirada degilse sirala)
  const enUst = [...eslesen].sort((a, b) => a - b).reduce<number | null>((e, i) => (e === null || yanitlar[i] > yanitlar[e] ? i : e), null);
  const enUstAlan: Alan = enUst === null ? "genel" : MADDELER[enUst].alanlar[0];

  return { alanlar, psikotik, ogrenciGizli, risk, enUstAlan };
}

export function uzmanlariSec(
  uzmanlar: UzmanOzeti[],
  sonuc: Sonuc,
  rastgele: () => number = Math.random,
  enFazla = 3,
): { bagimsiz: UzmanOzeti[]; ogrenci: UzmanOzeti[] | null } {
  const yalnizPsikotik = sonuc.alanlar.length === 1 && sonuc.alanlar[0] === "psikotik";
  const bolum = (kind: UzmanOzeti["kind"]) => {
    const buKind = uzmanlar.filter((u) => u.kind === kind);
    let uygun = buKind.filter((u) => u.specialties.some((a) => sonuc.alanlar.includes(a)));
    if (uygun.length === 0 && !yalnizPsikotik) uygun = buKind.filter((u) => u.specialties.includes("genel"));
    const karisik = karistir(uygun, rastgele);
    // kararli bolme: psikotik uzmanlar one, kendi karisik siralari korunur
    const onde = sonuc.psikotik ? karisik.filter((u) => u.specialties.includes("psikotik")) : [];
    return [...onde, ...karisik.filter((u) => !onde.includes(u))].slice(0, enFazla);
  };
  return { bagimsiz: bolum("independent"), ogrenci: sonuc.ogrenciGizli ? null : bolum("student") };
}
