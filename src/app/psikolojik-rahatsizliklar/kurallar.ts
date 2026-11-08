import type { Alan } from "@/lib/sabitler";
import type { His } from "./veri";

// Agir kartlar yalnizca bagimsiz uzmanlara baglanir (ogrenci uzmanlara kapali).
export function uzmanBaglantisi(r: { alan: Alan; agir: boolean }): string {
  return `/uzmanlar?alan=${r.alan}${r.agir ? "&tur=independent" : ""}`;
}

// Ogrenci uzman basvurusunda sorulan liste: ciddi kartlarin adlari.
export function ciddiDurumlar(liste: { ad: string; agir: boolean }[]): string[] {
  return liste.filter((r) => r.agir).map((r) => r.ad);
}

export function ogrenciBasvurabilir(ogrenci: boolean, yanit: unknown): boolean {
  return !ogrenci || yanit === "hayir";
}

// Secili hislerden en az birine bagli kartlar. Secim bos ise null: hicbir kart soluk degil.
export function oneCikanKartlar(secili: string[], hisler: His[]): Set<string> | null {
  if (secili.length === 0) return null;
  return new Set(hisler.filter((h) => secili.includes(h.ad)).flatMap((h) => h.kartlar));
}
