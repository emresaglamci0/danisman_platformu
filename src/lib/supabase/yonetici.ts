import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAyarlari } from "./ayarlar";

// GIZLI anahtarla calisan istemci: veritabani kurallarini (RLS) atlar.
// "server-only" satiri, bu dosya yanlislikla tarayiciya giden koda eklenirse derlemeyi durdurur.
// Yalnizca sunucuda, kullanicinin yetkisi kontrol EDILDIKTEN SONRA dosya yukleme/silme icin kullanilir.
export function supabaseYonetici() {
  const ayarlar = supabaseAyarlari();
  const gizliAnahtar = process.env.SUPABASE_SECRET_KEY;
  if (!ayarlar || !gizliAnahtar) {
    throw new Error("Sunucu ayarları eksik: .env.local içinde SUPABASE_SECRET_KEY dolu olmalı.");
  }
  return createClient(ayarlar.url, gizliAnahtar, { auth: { persistSession: false } });
}

export const BELGE_DEPOSU = "uzman-belgeleri";
export const FOTOGRAF_DEPOSU = "profil-fotograflari";
