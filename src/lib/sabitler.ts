// Veritabanindaki kodlar ile ekranda gorunen Turkce karsiliklari.
// Buradaki anahtarlar supabase/migrations icindeki "check" listeleriyle ayni olmali.

// Metin degistiginde surum de degistirilmeli; kullanicidan yeni surum icin tekrar onay istenir.
export const KVKK_SURUMU = "2026-10-31b-taslak";
export const ACIK_RIZA_SURUMU = "2026-10-31b-taslak";

// Kullanicinin secebilecegi sikayet sebepleri (veritabanindaki listeyle ayni)
export const SIKAYET_KATEGORILERI = {
  taciz: "Taciz veya hakaret",
  uygunsuz_icerik: "Uygunsuz içerik",
  spam: "Spam / reklam",
  guvenlik_riski: "Güvenlik endişesi (kendine veya başkasına zarar riski)",
  diger: "Diğer",
} as const;

export const ISARET_KAYNAKLARI = {
  user_report: "Kullanıcı şikayeti",
  admin_review: "Yönetici incelemesi",
  auto_moderation: "Otomatik moderasyon",
} as const;

export const ISARET_KATEGORILERI: Record<string, string> = {
  ...SIKAYET_KATEGORILERI,
  admin_inceleme: "Yönetici incelemesi",
  otomatik: "Otomatik tespit",
};

export const MESAJ_EN_FAZLA = 2000;

// ORNEK ADRES: yayindan once sirketin gercek iletisim e-postasiyla degistirilmeli
export const ILETISIM_EPOSTASI = "iletisim@example.com";

// Yasal metin sayfalarinin (kullanim kosullari, gizlilik, cerez vb.) son guncelleme tarihi
export const YASAL_METIN_TARIHI = "02.11.2026";

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

export function tarihSaatYaz(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "short",
    timeStyle: "short",
  });
}
