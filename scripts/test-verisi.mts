// Veritabanina UYDURMA test kullanicilari ekler. Gercek kisi verisi icermez.
// Calistirma: npm run test-verisi
// Gizli anahtar (SUPABASE_SECRET_KEY) yalnizca bu betikte kullanilir; tarayiciya asla gitmez.

import { createCipheriv, randomBytes } from "node:crypto";
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
const KVKK_SURUMU = "2026-11-08-taslak"; // src/lib/sabitler.ts ile ayni olmali

type TestUzmani = {
  eposta: string;
  ad: string;
  rol: "expert" | "student_expert";
  unvan?: string;
  bolum?: string;
  alanlar: string[];
  tanitim: string;
  onGorusme?: boolean;
};

const UZMANLAR: TestUzmani[] = [
  {
    eposta: "test.uzman1@example.com",
    ad: "Ayla Örnek",
    rol: "expert",
    unvan: "psikolog",
    alanlar: ["kaygi", "ozguven", "duygudurum", "travma"],
    tanitim: "Uydurma test profili. Kaygı ve özgüven konularında bilişsel davranışçı yaklaşımla çalışır.",
    onGorusme: true,
  },
  {
    eposta: "test.uzman2@example.com",
    ad: "Kerem Deneme",
    rol: "expert",
    unvan: "psikolojik_danisman",
    alanlar: ["kariyer", "genel", "psikotik"],
    tanitim: "Uydurma test profili. Üniversite öğrencileri ve genç yetişkinlerle kariyer danışmanlığı yapar.",
  },
  {
    eposta: "test.uzman3@example.com",
    ad: "Selin Taslak",
    rol: "expert",
    unvan: "psikolog",
    alanlar: ["iliski", "aile"],
    tanitim: "Uydurma test profili. Çift ve aile ilişkileri üzerine çalışır.",
    onGorusme: true,
  },
  {
    eposta: "test.uzman4@example.com",
    ad: "Murat Uydurma",
    rol: "expert",
    unvan: "psikolojik_danisman",
    alanlar: ["yas", "kaygi", "genel"],
    tanitim: "Uydurma test profili. Yas ve kayıp süreçlerinde destek verir.",
  },
  {
    eposta: "test.ogrenci1@example.com",
    ad: "Ece Prova",
    rol: "student_expert",
    bolum: "klinik_psikoloji_yl",
    alanlar: ["genel", "ozguven", "yeme"],
    tanitim: "Uydurma test profili. Klinik Psikoloji yüksek lisans öğrencisi. Görüşmeler ücretsiz, staj kapsamında.",
  },
  {
    eposta: "test.ogrenci2@example.com",
    ad: "Can Misal",
    rol: "student_expert",
    bolum: "pdr",
    alanlar: ["kariyer"],
    tanitim: "Uydurma test profili. PDR 4. sınıf öğrencisi. Görüşmeler ücretsiz, staj kapsamında.",
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
const uzmanKimlikleri = new Map<string, string>();

for (const uzman of UZMANLAR) {
  const id = await kullaniciOlustur(uzman.eposta, {
    role: uzman.rol,
    full_name: uzman.ad,
    title: uzman.unvan,
    department: uzman.bolum,
    final_year: uzman.rol === "student_expert",
    kvkk_version: KVKK_SURUMU,
  });
  uzmanKimlikleri.set(uzman.eposta, id);

  // Gercekte bu adim yonetici onayi ile yapilir; test icin dogrudan onayliyoruz.
  const { error } = await supabase
    .from("expert_profiles")
    .update({
      status: "approved",
      specialties: uzman.alanlar,
      bio: uzman.tanitim,
      offers_free_intro: uzman.onGorusme ?? false,
      verified_until: uzman.rol === "student_expert" ? ogrenciBelgesiGecerlilik : null,
      offers_online: true,
      session_minutes: 50,
    })
    .eq("id", id);
  if (error) throw error;

  // Hafta ici 10:00, 14:00 ve 18:00. Tekrar calistirilirsa hata vermez.
  const { error: takvimHatasi } = await supabase.from("expert_availability").upsert(
    [1, 2, 3, 4, 5].flatMap((gun) => [10, 14, 18].map((saat) => ({ expert_id: id, weekday: gun, hour: saat }))),
  );
  if (takvimHatasi) throw takvimHatasi;
  console.log(`✓ ${uzman.ad} (${uzman.eposta})`);
}

const DANISAN_EPOSTA = "test.danisan@example.com";
const danisanId = await kullaniciOlustur(DANISAN_EPOSTA, {
  role: "client",
  full_name: "Deniz Deneme",
  kvkk_version: KVKK_SURUMU,
});
console.log(`✓ Deniz Deneme (${DANISAN_EPOSTA}) - danışan`);

// ---------- Puanlama demosu ----------
// Tekrar calistirilirsa yalnizca bu betigin urettigi satirlar silinip yeniden yazilir:
// test uzmanlarinin puanlari ve test danisaninin seans kayitlari.
const bagimsizUzmanlar = UZMANLAR.filter((u) => u.rol === "expert").map((u) => uzmanKimlikleri.get(u.eposta)!);
const { error: eskiPuanHatasi } = await supabase.from("expert_ratings").delete().in("expert_id", bagimsizUzmanlar);
if (eskiPuanHatasi) throw eskiPuanHatasi;
const { error: eskiSeansHatasi } = await supabase.from("session_offers").delete().eq("client_id", danisanId);
if (eskiSeansHatasi) throw eskiSeansHatasi;

// Danisan baglantisi yok (client_id bos): silinmis danisanin puani gibi davranir.
const puanSatirlari = (eposta: string, puanlar: number[]) =>
  puanlar.map((rating) => ({ expert_id: uzmanKimlikleri.get(eposta)!, client_id: null, rating }));
const { error: puanHatasi } = await supabase.from("expert_ratings").insert([
  ...puanSatirlari("test.uzman1@example.com", [...Array(15).fill(5), ...Array(15).fill(4)]), // 30 x 4,5
  ...puanSatirlari("test.uzman2@example.com", [5]), // 1 x 5
  ...puanSatirlari("test.uzman3@example.com", Array(5).fill(1)), // 5 x 1 (alt bolum)
]); // test.uzman4 puansiz
if (puanHatasi) throw puanHatasi;
console.log("✓ Test puanları: uzman1 30 x 4,5; uzman2 1 x 5; uzman3 5 x 1; uzman4 puansız");

// Puan penceresi icin danisan ile uzman1 arasinda bir sohbet gerekir.
// Anahtar, src/lib/sifreleme.ts ile ayni bicimde (ana anahtarla AES-256-GCM) sarilir.
// Betik "server-only" iceren o dosyayi iceri alamaz; bu yuzden ayni adimlar burada tekrarlanir.
const puanliUzmanId = uzmanKimlikleri.get("test.uzman1@example.com")!;
let { data: konusma } = await supabase
  .from("conversations")
  .select("id")
  .eq("client_id", danisanId)
  .eq("expert_id", puanliUzmanId)
  .maybeSingle();

if (!konusma) {
  let { data: basvuru } = await supabase
    .from("applications")
    .select("id")
    .eq("client_id", danisanId)
    .eq("expert_id", puanliUzmanId)
    .eq("status", "pending")
    .maybeSingle();
  if (!basvuru) {
    const { data: saatler, error: saatHatasi } = await supabase.rpc("uzman_musait_saatler", {
      p_uzman: puanliUzmanId,
      p_bas: new Date().toISOString(),
      p_bit: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
    if (saatHatasi || !saatler?.length) throw saatHatasi ?? new Error("Uzman1 için uygun saat bulunamadı");
    const { data, error } = await supabase
      .from("applications")
      .insert({ client_id: danisanId, expert_id: puanliUzmanId, topic: "genel", requested_start: saatler[0] })
      .select("id")
      .single();
    if (error) throw error;
    basvuru = data;
  }
  const { data: anaAnahtarMetni, error: anahtarHatasi } = await supabase.rpc("mesaj_ana_anahtari");
  if (anahtarHatasi || typeof anaAnahtarMetni !== "string") throw anahtarHatasi ?? new Error("Ana anahtar alınamadı");
  const iv = randomBytes(12);
  const sifreleyici = createCipheriv("aes-256-gcm", Buffer.from(anaAnahtarMetni, "base64"), iv);
  sifreleyici.setAAD(Buffer.from(`konusma:${basvuru.id}`, "utf8"));
  const sifreli = Buffer.concat([sifreleyici.update(randomBytes(32)), sifreleyici.final()]);
  const sarilmis = ["v1", iv, sifreleyici.getAuthTag(), sifreli]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
  const { data: konusmaId, error: kabulHatasi } = await supabase.rpc("basvuru_kabul", {
    p_basvuru: basvuru.id,
    p_uzman: puanliUzmanId,
    p_sarili_anahtar: sarilmis,
  });
  if (kabulHatasi) throw kabulHatasi;
  konusma = { id: konusmaId as string };
}

// Geçmiş tarihli, onaylı, ücretli 2 seans (çakışmaz): puan penceresi bunlarla açılır.
const seansBaslangiclari = [3, 2].map((gun) => new Date(Date.now() - gun * 86400000));
const { error: seansHatasi } = await supabase.from("session_offers").insert(
  seansBaslangiclari.map((bas) => ({
    conversation_id: konusma.id,
    expert_id: puanliUzmanId,
    client_id: danisanId,
    starts_at: bas.toISOString(),
    ends_at: new Date(bas.getTime() + 50 * 60000).toISOString(),
    price_kurus: 150000,
    status: "confirmed",
  })),
);
if (seansHatasi) throw seansHatasi;
console.log("✓ Deniz Deneme ile Ayla Örnek arasında 2 geçmiş seans");

console.log("\nTest verisi hazır. Tüm test hesaplarının şifresi .env.local içindeki SEED_TEST_SIFRESI değeridir.");
console.log(`Puan penceresi için: ${DANISAN_EPOSTA} ile giriş yapın.`);
