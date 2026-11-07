// Seans takvimi ve planlarinin saf kurallari. Disariya bagimli degildir, scripts/seans-kurallari.test.mts
// ile sinanir. Ayni sinirlar veritabaninda da uygulanir (0016, 0017); biri degisirse digeri de degismeli.

export const SEANS_SURELERI = [30, 45, 50, 60, 90, 120] as const;
export const SAAT_ILK = 8;
export const SAAT_SON = 21; // son baslangic saati
export const GORUNEN_HAFTA = 4;
export const UCRET_EN_AZ = 1;
export const UCRET_EN_FAZLA = 10000;
export const KOMISYON_ORANI = 0.05;
const SAAT = 3_600_000;
const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
export const TAM_GUN_ADLARI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// shortcut: Turkiye sabit UTC+3 kabul edilir, yaz saati uygulamasi geri gelirse guncellenmeli.
const TURKIYE_FARKI = 3 * SAAT;

export function saatIso(tarih: string, saat: number): string {
  return new Date(`${tarih}T${String(saat).padStart(2, "0")}:00:00+03:00`).toISOString();
}

export function saatParcalari(iso: string): { tarih: string; saat: number } {
  const yerel = new Date(new Date(iso).getTime() + TURKIYE_FARKI).toISOString();
  return { tarih: yerel.slice(0, 10), saat: Number(yerel.slice(11, 13)) };
}

// Ornek: "Salı 10.11.2026 14:00"
export function saatEtiketi(iso: string): string {
  const yerel = new Date(new Date(iso).getTime() + TURKIYE_FARKI);
  const metin = yerel.toISOString();
  const gun = TAM_GUN_ADLARI[(yerel.getUTCDay() + 6) % 7];
  return `${gun} ${metin.slice(8, 10)}.${metin.slice(5, 7)}.${metin.slice(0, 4)} ${metin.slice(11, 16)}`;
}

// hafta: 0 bu hafta, 1 sonraki hafta. gun: 1 pazartesi ... 7 pazar.
export function haftaGunleri(hafta: number, simdi: Date): { tarih: string; etiket: string; gun: number }[] {
  const bugun = new Date(simdi.getTime() + TURKIYE_FARKI);
  const haftaIci = (bugun.getUTCDay() + 6) % 7;
  return GUN_ADLARI.map((ad, i) => {
    const gun = new Date(bugun.getTime() + (i - haftaIci + hafta * 7) * 24 * SAAT);
    const tarih = gun.toISOString().slice(0, 10);
    return { tarih, etiket: `${ad} ${tarih.slice(8, 10)}.${tarih.slice(5, 7)}`, gun: i + 1 };
  });
}

export function ucretGecerli(deger: string): number | null {
  if (!/^\d+$/.test(deger)) return null;
  const ucret = Number(deger);
  return ucret >= UCRET_EN_AZ && ucret <= UCRET_EN_FAZLA ? ucret : null;
}

export function komisyon(kurus: number): { komisyon: number; uzmanaKalan: number } {
  const pay = Math.round(kurus * KOMISYON_ORANI);
  return { komisyon: pay, uzmanaKalan: kurus - pay };
}

// Yalnizca ekrandaki aciklama icindir; asil karari veritabani verir (0017).
export function iptalIadeli(iptalEden: "client" | "expert", baslangic: string, simdi: Date): boolean {
  if (iptalEden === "expert") return true;
  return new Date(baslangic).getTime() - simdi.getTime() > 24 * SAAT;
}

// shortcut: yalnizca duz yazilmis IBAN ve telefonu yakalar, harfle yazilan numarayi yakalamaz; gercek moderasyon gelirse degistirilmeli.
const IBAN = /\bTR\s?\d{2}(?:[\s-]?\d){22}(?!\d)/i;
const TELEFON = /(?<!\d)(?:\+?90[\s.-]?|0)\(?[2-5]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/;

export function odemeKalibiVar(metin: string): boolean {
  return IBAN.test(metin) || TELEFON.test(metin);
}
