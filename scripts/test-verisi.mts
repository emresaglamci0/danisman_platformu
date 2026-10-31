// Veritabanina UYDURMA test kullanicilari ekler. Gercek kisi verisi icermez.
// Calistirma: npm run test-verisi
// Gizli anahtar (SUPABASE_SECRET_KEY) yalnizca bu betikte kullanilir; tarayiciya asla gitmez.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const gizliAnahtar = process.env.SUPABASE_SECRET_KEY;
const sifre = process.env.SEED_TEST_SIFRESI;

if (!url || !gizliAnahtar || !sifre || sifre.length < 8) {
  console.error(
    "Eksik ayar: .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY ve " +
      "SEED_TEST_SIFRESI (en az 8 karakter) dolu olmalı.",
  );
  process.exit(1);
}

// Adresin sonundaki "/rest/v1/" gibi ekleri at; yalnizca "https://xxxx.supabase.co" kalsin
const supabase = createClient(new URL(url).origin, gizliAnahtar, { auth: { persistSession: false } });
const KVKK_SURUMU = "2026-10-31b-taslak"; // src/lib/sabitler.ts ile ayni olmali

type TestUzmani = {
  eposta: string;
  ad: string;
  rol: "expert" | "student_expert";
  unvan?: string;
  bolum?: string;
  alanlar: string[];
  tanitim: string;
};

const UZMANLAR: TestUzmani[] = [
  {
    eposta: "test.uzman1@example.com",
    ad: "Ayla Örnek",
    rol: "expert",
    unvan: "klinik_psikolog",
    alanlar: ["kaygi", "ozguven"],
    tanitim: "Uydurma test profili. Kaygı ve özgüven konularında bilişsel davranışçı yaklaşımla çalışır.",
  },
  {
    eposta: "test.uzman2@example.com",
    ad: "Kerem Deneme",
    rol: "expert",
    unvan: "psikolojik_danisman",
    alanlar: ["kariyer", "genel"],
    tanitim: "Uydurma test profili. Üniversite öğrencileri ve genç yetişkinlerle kariyer danışmanlığı yapar.",
  },
  {
    eposta: "test.uzman3@example.com",
    ad: "Selin Taslak",
    rol: "expert",
    unvan: "psikolog",
    alanlar: ["iliski", "aile"],
    tanitim: "Uydurma test profili. Çift ve aile ilişkileri üzerine çalışır.",
  },
  {
    eposta: "test.uzman4@example.com",
    ad: "Murat Uydurma",
    rol: "expert",
    unvan: "uzman_psikolojik_danisman",
    alanlar: ["yas", "kaygi", "genel"],
    tanitim: "Uydurma test profili. Yas ve kayıp süreçlerinde destek verir.",
  },
  {
    eposta: "test.ogrenci1@example.com",
    ad: "Ece Prova",
    rol: "student_expert",
    bolum: "psikoloji",
    alanlar: ["genel", "ozguven"],
    tanitim: "Uydurma test profili. Psikoloji son sınıf öğrencisi, staj kapsamında hizmet verir.",
  },
  {
    eposta: "test.ogrenci2@example.com",
    ad: "Can Misal",
    rol: "student_expert",
    bolum: "pdr",
    alanlar: ["kariyer"],
    tanitim: "Uydurma test profili. PDR son sınıf öğrencisi, staj kapsamında hizmet verir.",
  },
];

// Kullaniciyi olusturur; zaten varsa mevcut kullanicinin kimligini dondurur.
async function kullaniciOlustur(eposta: string, ekBilgi: Record<string, unknown>) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: eposta,
    password: sifre,
    email_confirm: true,
    user_metadata: ekBilgi,
  });
  if (data.user) return data.user.id;
  if (error?.code !== "email_exists") throw error;

  const { data: liste, error: listeHatasi } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listeHatasi) throw listeHatasi;
  const mevcut = liste.users.find((u) => u.email === eposta);
  if (!mevcut) throw new Error(`${eposta} bulunamadı`);
  return mevcut.id;
}

const ogrenciBelgesiGecerlilik = "2027-06-30";

for (const uzman of UZMANLAR) {
  const id = await kullaniciOlustur(uzman.eposta, {
    role: uzman.rol,
    full_name: uzman.ad,
    title: uzman.unvan,
    department: uzman.bolum,
    final_year: uzman.rol === "student_expert",
    kvkk_version: KVKK_SURUMU,
  });

  // Gercekte bu adim yonetici onayi ile yapilir; test icin dogrudan onayliyoruz.
  const { error } = await supabase
    .from("expert_profiles")
    .update({
      status: "approved",
      specialties: uzman.alanlar,
      bio: uzman.tanitim,
      verified_until: uzman.rol === "student_expert" ? ogrenciBelgesiGecerlilik : null,
    })
    .eq("id", id);
  if (error) throw error;
  console.log(`✓ ${uzman.ad} (${uzman.eposta})`);
}

await kullaniciOlustur("test.danisan@example.com", {
  role: "client",
  full_name: "Deniz Deneme",
  kvkk_version: KVKK_SURUMU,
});
console.log("✓ Deniz Deneme (test.danisan@example.com) - danışan");

console.log("\nTest verisi hazır. Tüm test hesaplarının şifresi .env.local içindeki SEED_TEST_SIFRESI değeridir.");
