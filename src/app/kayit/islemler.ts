"use server";

import { redirect } from "next/navigation";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { turkceHata, type FormDurumu } from "@/lib/hatalar";
import { BOLUMLER, KVKK_SURUMU, UNVANLAR, listedeMi } from "@/lib/sabitler";
import { ogrenciModuluAktif } from "@/modules/ogrenci/ayar";

const SECILEBILIR_ROLLER = ["client", "expert", "student_expert"] as const;

export async function kayitOl(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!supabaseAyarlari()) return { hata: "Veritabanı bağlantısı ayarlanmamış." };

  const rol = String(form.get("rol") ?? "");
  const adSoyad = String(form.get("adSoyad") ?? "").trim();
  const eposta = String(form.get("eposta") ?? "").trim();
  const sifre = String(form.get("sifre") ?? "");
  const unvan = form.get("unvan");
  const bolum = form.get("bolum");

  // Formdaki her bilgi sunucuda da kontrol edilir; tarayiciya guvenilmez.
  if (
    !SECILEBILIR_ROLLER.includes(rol as (typeof SECILEBILIR_ROLLER)[number]) ||
    (rol === "student_expert" && !ogrenciModuluAktif())
  ) {
    return { hata: "Lütfen bir hesap türü seçin." };
  }
  if (adSoyad.length < 2 || adSoyad.length > 80) {
    return { hata: "Ad soyad 2 ile 80 karakter arasında olmalı.", alan: "adSoyad" };
  }
  if (sifre.length < 8) return { hata: "Şifre en az 8 karakter olmalı.", alan: "sifre" };
  if (form.get("kvkk") !== "on") {
    return { hata: "Devam etmek için KVKK Aydınlatma Metni'ni okuduğunuzu onaylayın.", alan: "kvkk" };
  }

  const ekBilgi: Record<string, unknown> = {
    role: rol,
    full_name: adSoyad,
    kvkk_version: KVKK_SURUMU,
  };

  if (rol === "expert") {
    if (!listedeMi(UNVANLAR, unvan)) return { hata: "Lütfen unvanınızı seçin.", alan: "unvan" };
    ekBilgi.title = unvan;
  }
  if (rol === "student_expert") {
    if (!listedeMi(BOLUMLER, bolum)) return { hata: "Lütfen bölümünüzü seçin.", alan: "bolum" };
    if (form.get("sonSinif") !== "on") {
      return {
        hata: "Öğrenci uzman olarak yalnızca PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencileri staj kapsamında katılabilir.",
        alan: "sonSinif",
      };
    }
    ekBilgi.department = bolum;
    ekBilgi.final_year = true;
  }

  const siteAdresi = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await supabaseSunucu();
  const { data, error } = await supabase.auth.signUp({
    email: eposta,
    password: sifre,
    options: { data: ekBilgi, emailRedirectTo: `${siteAdresi}/auth/callback` },
  });
  if (error) return { hata: turkceHata(error.code) };

  // E-posta dogrulamasi kapaliysa oturum hemen acilir
  if (data.session) redirect("/panel");

  return {
    basari: "Kaydınız alındı. E-posta adresinize gelen bağlantıya tıklayarak hesabınızı doğrulayın.",
  };
}
