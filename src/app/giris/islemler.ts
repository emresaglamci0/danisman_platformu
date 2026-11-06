"use server";

import { redirect } from "next/navigation";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { turkceHata, type FormDurumu } from "@/lib/hatalar";

export async function girisYap(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!supabaseAyarlari()) return { hata: "Veritabanı bağlantısı ayarlanmamış." };

  const eposta = String(form.get("eposta") ?? "").trim();
  const sifre = String(form.get("sifre") ?? "");
  if (!eposta || !sifre) return { hata: "E-posta ve şifre gerekli." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: sifre });
  if (error) return { hata: turkceHata(error.code) };

  redirect("/panel");
}

// Kayitli olsun olmasin ayni yanit verilir: yoksa bu form, bir e-postanin sitede hesabi olup
// olmadigini (hassas bir bilgi) ogrenmek icin kullanilabilirdi.
export async function sifreSifirlamaIste(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!supabaseAyarlari()) return { hata: "Veritabanı bağlantısı ayarlanmamış." };

  const eposta = String(form.get("eposta") ?? "").trim();
  if (!eposta) return { hata: "E-posta adresinizi yazın." };

  const siteAdresi = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await supabaseSunucu();
  const { error } = await supabase.auth.resetPasswordForEmail(eposta, {
    redirectTo: `${siteAdresi}/auth/callback?sonra=sifre-yenile`,
  });
  if (error) console.error("Şifre sıfırlama e-postası gönderilemedi:", error.code);

  return {
    basari: "Bu adresle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. E-postanızı kontrol edin.",
  };
}

export async function sifreYenile(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!supabaseAyarlari()) return { hata: "Veritabanı bağlantısı ayarlanmamış." };

  const sifre = String(form.get("sifre") ?? "");
  if (sifre.length < 8) return { hata: "Şifre en az 8 karakter olmalı." };
  if (sifre !== form.get("sifreTekrar")) return { hata: "Şifreler birbiriyle aynı değil." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.auth.updateUser({ password: sifre });
  if (error) return { hata: turkceHata(error.code) };

  redirect("/panel");
}

export async function cikisYap() {
  if (supabaseAyarlari()) {
    const supabase = await supabaseSunucu();
    await supabase.auth.signOut();
  }
  redirect("/");
}
