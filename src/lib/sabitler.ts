// Veritabanindaki kodlar ile ekranda gorunen Turkce karsiliklari.
// Buradaki anahtarlar supabase/migrations icindeki "check" listeleriyle ayni olmali.

export const KVKK_SURUMU = "2026-10-taslak";

export const ROLLER = {
  client: "Danışan",
  expert: "Uzman",
  student_expert: "Öğrenci Uzman (Stajyer)",
  admin: "Yönetici",
} as const;
export type Rol = keyof typeof ROLLER;

export const UNVANLAR = {
  psikolog: "Psikolog",
  klinik_psikolog: "Klinik Psikolog",
  psikolojik_danisman: "Psikolojik Danışman",
  uzman_psikolojik_danisman: "Uzman Psikolojik Danışman",
} as const;
export type Unvan = keyof typeof UNVANLAR;

export const BOLUMLER = {
  psikoloji: "Psikoloji",
  pdr: "Rehberlik ve Psikolojik Danışmanlık (PDR)",
} as const;
export type Bolum = keyof typeof BOLUMLER;

export const ALANLAR = {
  kaygi: "Kaygı ve stres",
  iliski: "İlişkiler",
  aile: "Aile",
  kariyer: "Kariyer ve okul",
  ozguven: "Özgüven",
  yas: "Yas ve kayıp",
  genel: "Genel danışmanlık",
} as const;
export type Alan = keyof typeof ALANLAR;

export const UYGUN_ZAMANLAR = {
  hafta_ici_gunduz: "Hafta içi gündüz",
  hafta_ici_aksam: "Hafta içi akşam",
  hafta_sonu: "Hafta sonu",
} as const;
export type UygunZaman = keyof typeof UYGUN_ZAMANLAR;

export const BASVURU_DURUMLARI = {
  pending: "Yanıt bekleniyor",
  accepted: "Kabul edildi",
  rejected: "Reddedildi",
} as const;
export type BasvuruDurumu = keyof typeof BASVURU_DURUMLARI;

export const UZMAN_DURUMLARI = {
  pending: "Onay bekliyor",
  approved: "Onaylı",
  rejected: "Reddedildi",
  expired: "Belge yenilenmeli",
} as const;
export type UzmanDurumu = keyof typeof UZMAN_DURUMLARI;

// Belge turleri ve hangi uzman turunun yukleyebilecegi
export const BELGE_TURLERI = {
  barkodlu_belge: { ad: "Barkodlu belge (e-Devlet YÖK mezun belgesi)", tur: "independent" },
  diploma: { ad: "Üniversite diploması", tur: "independent" },
  edevlet_ogrenci_belgesi: { ad: "e-Devlet onaylı öğrenci belgesi", tur: "student" },
} as const;
export type BelgeTuru = keyof typeof BELGE_TURLERI;

export function belgeTurleri(tur: "independent" | "student") {
  return (Object.keys(BELGE_TURLERI) as BelgeTuru[]).filter((k) => BELGE_TURLERI[k].tur === tur);
}

// Bir degerin verilen listede olup olmadigini kontrol eder (form dogrulamasi icin)
export function listedeMi<T extends Record<string, unknown>>(
  liste: T,
  deger: unknown,
): deger is keyof T {
  return typeof deger === "string" && Object.hasOwn(liste, deger);
}

export function tarihYaz(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
}
