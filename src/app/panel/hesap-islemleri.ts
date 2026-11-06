"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { turkceHata, type FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { BELGE_DEPOSU, FOTOGRAF_DEPOSU, supabaseYonetici } from "@/lib/supabase/yonetici";

const GENEL_HATA = "Hesabınız silinemedi. Lütfen tekrar deneyin.";

// Hesabi ve bagli verileri (profil, basvurular, sohbetler, mesajlar, onaylar) kalici olarak siler.
// Veritabani baglari bunlari kendiliginden siler; degistirilemez erisim ve islem kayitlari kalir.
export async function hesabiSil(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  const ayarlar = supabaseAyarlari();
  if (!kullanici || !ayarlar) return { hata: "Bu işlem için giriş yapmalısınız." };
  // Admin yetkisi ve hesabi yalnizca SQL Editor'den yonetilir
  if (kullanici.rol === "admin") return { hata: "Yönetici hesabı buradan silinemez." };

  const sifre = String(form.get("sifre") ?? "");
  if (!sifre || form.get("onay") !== "on") {
    return { hata: "Devam etmek için şifrenizi yazın ve kutuyu işaretleyin." };
  }

  const yonetici = supabaseYonetici();

  // Sohbet silinince sikayet kaydi da silinir: hesap silerek kanit yok edilemesin.
  const { data: sohbetler, error: sohbetHatasi } = await yonetici
    .from("conversations")
    .select("id")
    .or(`client_id.eq.${kullanici.id},expert_id.eq.${kullanici.id}`);
  if (sohbetHatasi) return { hata: GENEL_HATA };

  const { count, error: isaretHatasi } = await yonetici
    .from("conversation_flags")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .in("conversation_id", (sohbetler ?? []).map((s) => s.id));
  if (isaretHatasi) return { hata: GENEL_HATA };
  if (count) {
    return { hata: "Sohbetlerinizden birinde açık bir şikayet veya inceleme var. Hesabınız bu işlem sonuçlanınca silinebilir." };
  }

  // Sifre, ayri bir istemciyle kontrol edilir: mevcut oturumun cerezlerine dokunmaz.
  const { data: kimlik } = await (await supabaseSunucu()).auth.getUser();
  if (!kimlik.user?.email) return { hata: GENEL_HATA };
  const { error: sifreHatasi } = await createClient(ayarlar.url, ayarlar.anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.signInWithPassword({ email: kimlik.user.email, password: sifre });
  if (sifreHatasi) {
    return { hata: sifreHatasi.code === "invalid_credentials" ? "Şifreniz hatalı." : turkceHata(sifreHatasi.code) };
  }

  // Once dosyalar silinir: bu adim basarisiz olursa hesap durur, sahipsiz kimlik belgesi kalmaz.
  for (const depo of [BELGE_DEPOSU, FOTOGRAF_DEPOSU]) {
    const { data: dosyalar, error } = await yonetici.storage.from(depo).list(kullanici.id, { limit: 1000 });
    if (error) return { hata: GENEL_HATA };
    if (dosyalar.length > 0) {
      const yollar = dosyalar.map((d) => `${kullanici.id}/${d.name}`);
      const { error: silmeHatasi } = await yonetici.storage.from(depo).remove(yollar);
      if (silmeHatasi) return { hata: GENEL_HATA };
    }
  }

  const { error: hesapHatasi } = await yonetici.auth.admin.deleteUser(kullanici.id);
  if (hesapHatasi) {
    console.error("Hesap silinemedi:", hesapHatasi.code);
    return { hata: GENEL_HATA };
  }

  // Hesap artik yok; tarayicidaki oturum cerezleri de temizlenir
  await (await supabaseSunucu()).auth.signOut({ scope: "local" });
  redirect("/hesap-silindi");
}
