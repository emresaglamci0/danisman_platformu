import { connection } from "next/server";
import { supabaseAyarlari } from "./supabase/ayarlar";
import { supabaseSunucu } from "./supabase/sunucu";
import type { Rol } from "./sabitler";

// aal: oturumun guvence seviyesi. "aal2" = iki adimli dogrulamadan (TOTP kodu) gecmis.
export type Kullanici = { id: string; rol: Rol; adSoyad: string; aal: string };

// Giris yapmis kullaniciyi ve rolunu dondurur; giris yoksa null.
export async function mevcutKullanici(): Promise<Kullanici | null> {
  // Sayfa her istekte yeniden olusturulsun (onbellege alinmasin): kullaniciya gore degisir.
  await connection();
  if (!supabaseAyarlari()) return null;

  const supabase = await supabaseSunucu();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", id)
    .single();
  if (!profil) return null;

  return { id, rol: profil.role, adSoyad: profil.full_name, aal: String(data?.claims?.aal ?? "aal1") };
}
