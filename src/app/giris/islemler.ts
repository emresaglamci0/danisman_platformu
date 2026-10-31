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

export async function cikisYap() {
  if (supabaseAyarlari()) {
    const supabase = await supabaseSunucu();
    await supabase.auth.signOut();
  }
  redirect("/");
}
