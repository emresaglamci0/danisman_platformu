// Veritabanindaki kodlar ile ekranda gorunen Turkce karsiliklari.
// Buradaki anahtarlar supabase/migrations icindeki "check" listeleriyle ayni olmali.

// Metin degistiginde surum de degistirilmeli; kullanicidan yeni surum icin tekrar onay istenir.
export const KVKK_SURUMU = "2026-11-08-taslak";
export const ACIK_RIZA_SURUMU = "2026-11-07-taslak";

// Kullanicinin secebilecegi sikayet sebepleri (veritabanindaki listeyle ayni)
export const SIKAYET_KATEGORILERI = {
  taciz: "Taciz veya hakaret",
  uygunsuz_icerik: "Uygunsuz içerik",
  spam: "Spam / reklam",
  guvenlik_riski: "Güvenlik endişesi (kendine veya başkasına zarar riski)",
  site_disi_odeme: "Site dışına ödeme yönlendirmesi",
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
  seans_yapilmadi: "Seans yapılmadı",
};

export const MESAJ_EN_FAZLA = 2000;
export const TANITIM_EN_FAZLA = 600; // veritabanindaki bio siniriyla ayni

// ORNEK ADRES: yayindan once sirketin gercek iletisim e-postasiyla degistirilmeli
export const ILETISIM_EPOSTASI = "iletisim@example.com";

// Yasal metin sayfalarinin (kullanim kosullari, gizlilik, cerez vb.) son guncelleme tarihi
export const YASAL_METIN_TARIHI = "07.11.2026";

export const ROLLER = {
  client: "Danışan",
  expert: "Uzman",
  student_expert: "Öğrenci Uzman (Stajyer)",
  admin: "Yönetici",
} as const;
export type Rol = keyof typeof ROLLER;

export const UNVANLAR = {
  psikolog: "Psikolog",
  psikolojik_danisman: "Psikolojik Danışman",
} as const;
export type Unvan = keyof typeof UNVANLAR;

export const BOLUMLER = {
  pdr: "PDR 4. sınıf",
  klinik_psikoloji_yl: "Klinik Psikoloji Yüksek Lisans",
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
  cift: "Çift ve evlilik",
  cocuk_ergen: "Çocuk ve ergen",
  ebeveynlik: "Ebeveynlik",
  tukenmislik: "Tükenmişlik ve iş stresi",
  duygudurum: "Depresyon ve duygudurum",
  travma: "Travma",
  yeme: "Yeme ve beden algısı",
  bagimlilik: "Bağımlılık",
  uyku: "Uyku sorunları",
  cinsel: "Cinsel sorunlar",
  norogelisim: "Nörogelişim",
  psikotik: "Psikotik bozukluklar",
} as const;
export type Alan = keyof typeof ALANLAR;

// Öğrenci uzmanlar bu iki alanda hizmet vermez
export const OGRENCIYE_KAPALI_ALANLAR: readonly Alan[] = ["psikotik", "bagimlilik"];

export function ogrenciyeAcik(alan: Alan) {
  return !OGRENCIYE_KAPALI_ALANLAR.includes(alan);
}

// Bilinmeyen, tekrar eden ve (öğrenci için) kapalı alanları çıkarır
export function alanlariSuz(alanlar: unknown[], ogrenci: boolean): Alan[] {
  const sonuc = new Set<Alan>();
  for (const a of alanlar) {
    if (!listedeMi(ALANLAR, a)) continue;
    if (ogrenci && !ogrenciyeAcik(a)) continue;
    sonuc.add(a);
  }
  return [...sonuc];
}

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

export function paraYaz(kurus: number) {
  return (kurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
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
