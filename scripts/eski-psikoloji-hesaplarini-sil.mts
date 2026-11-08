// Artik kabul edilmeyen Psikoloji lisans ogrenci hesaplarini KALICI olarak siler.
// Once sayiya bakin: npm run eski-hesaplari-sil
// Silmek icin:       npm run eski-hesaplari-sil -- --onay
// Cikti yalnizca sayi icerir; ad veya e-posta yazilmaz.

import { createClient } from "@supabase/supabase-js";
import { silinecekleriAyir } from "./eski-psikoloji-kurali.mts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const gizliAnahtar = process.env.SUPABASE_SECRET_KEY;

if (!url || !gizliAnahtar) {
  console.error("Eksik ayar: .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY dolu olmalı.");
  process.exit(1);
}

const supabase = createClient(new URL(url).origin, gizliAnahtar, { auth: { persistSession: false } });

function dur(mesaj: string, hata: { code?: string } | null): never {
  console.error(`${mesaj} Kod: ${hata?.code ?? "bilinmiyor"}. Hiçbir hesap silinmedi.`);
  process.exit(1);
}

const { data: profiller, error: profilHatasi } = await supabase
  .from("expert_profiles")
  .select("id")
  .eq("kind", "student")
  .eq("department", "psikoloji");
if (profilHatasi) dur("Hesaplar okunamadı.", profilHatasi);
const hesaplar = profiller.map((p) => p.id as string);

const { data: sohbetler, error: sohbetHatasi } = await supabase
  .from("conversations")
  .select("id, expert_id")
  .in("expert_id", hesaplar);
if (sohbetHatasi) dur("Sohbetler okunamadı.", sohbetHatasi);

const { data: isaretler, error: isaretHatasi } = await supabase
  .from("conversation_flags")
  .select("conversation_id")
  .eq("status", "open")
  .in("conversation_id", sohbetler.map((s) => s.id));
if (isaretHatasi) dur("Şikayetler okunamadı.", isaretHatasi);

const { silinecek, atlanan } = silinecekleriAyir(hesaplar, sohbetler, isaretler);
console.log(`Silinecek: ${silinecek.length}, atlanan (açık şikayet/inceleme): ${atlanan.length}`);

if (!process.argv.includes("--onay")) {
  console.log("Hiçbir şey silinmedi. Silmek için: npm run eski-hesaplari-sil -- --onay");
  process.exit(0);
}

// Once dosyalar: bu adim basarisiz olursa hesap durur, sahipsiz kimlik belgesi kalmaz.
async function dosyalariSil(hesap: string): Promise<boolean> {
  for (const depo of ["uzman-belgeleri", "profil-fotograflari"]) {
    const { data: dosyalar, error } = await supabase.storage.from(depo).list(hesap, { limit: 1000 });
    if (error) return false;
    if (dosyalar.length > 0) {
      const { error: silmeHatasi } = await supabase.storage.from(depo).remove(dosyalar.map((d) => `${hesap}/${d.name}`));
      if (silmeHatasi) return false;
    }
  }
  return true;
}

let silinen = 0;
let hatali = 0;
for (const hesap of silinecek) {
  if (!(await dosyalariSil(hesap))) {
    hatali++;
    continue;
  }
  const { error } = await supabase.auth.admin.deleteUser(hesap);
  if (error) hatali++;
  else silinen++;
}

console.log(`Silinen: ${silinen}, hata: ${hatali}, atlanan: ${atlanan.length}`);
if (hatali > 0) process.exitCode = 1;
