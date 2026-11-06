"use server";

import { revalidatePath } from "next/cache";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { ALANLAR, TANITIM_EN_FAZLA, listedeMi } from "@/lib/sabitler";
import { yeniKonusmaAnahtari } from "@/lib/sifreleme";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { supabaseYonetici } from "@/lib/supabase/yonetici";

// Uzman tanitim yazisini ve calisma alanlarini gunceller. Ad ve unvan belgelerle dogrulandigi icin
// burada degistirilemez. Uzmanlarin tabloya yazma izni yok; sunucu yalnizca bu iki alani degistirir.
export async function profilGuncelle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) {
    return { hata: "Bu işlem yalnızca uzman hesapları içindir." };
  }

  const tanitim = String(form.get("tanitim") ?? "").trim();
  const alanlar = [...new Set(form.getAll("alanlar"))].filter((alan) => listedeMi(ALANLAR, alan));
  if (tanitim.length > TANITIM_EN_FAZLA) return { hata: `Tanıtım yazısı en fazla ${TANITIM_EN_FAZLA} karakter olabilir.` };
  if (alanlar.length === 0) return { hata: "En az bir çalışma alanı seçin." };

  const { error } = await supabaseYonetici()
    .from("expert_profiles")
    .update({ bio: tanitim || null, specialties: alanlar })
    .eq("id", kullanici.id);
  if (error) return { hata: "Profiliniz kaydedilemedi. Lütfen tekrar deneyin." };

  revalidatePath("/panel");
  return { basari: "Profiliniz güncellendi." };
}

// Bagimsiz uzman ucretsiz on gorusme tercihini acar veya kapatir. Uzmanlarin profil tablosuna
// yazma izni olmadigi icin sunucu, yalnizca bu alani ve yalnizca uzmanin kendi satirinda degistirir (0011).
export async function onGorusmeTercihiDegistir(form: FormData) {
  const kullanici = await mevcutKullanici();
  if (!kullanici || kullanici.rol !== "expert") return;

  await supabaseYonetici()
    .from("expert_profiles")
    .update({ offers_free_intro: form.get("acik") === "true" })
    .eq("id", kullanici.id);

  revalidatePath("/panel");
}

// Uzman bir basvuruyu kabul eder veya reddeder.
// Veritabani kurallari (RLS) da yalnizca ilgili uzmanin, yalnizca bekleyen basvuruyu
// degistirmesine izin verir. Kabul edilirse iki taraf arasinda konusma acilir.
export async function basvuruYanitla(form: FormData) {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) return;

  const basvuruId = String(form.get("basvuruId") ?? "");
  const karar = form.get("karar");
  if (karar !== "accepted" && karar !== "rejected") return;

  const supabase = await supabaseSunucu();
  const { data: basvuru } = await supabase
    .from("applications")
    .update({ status: karar })
    .eq("id", basvuruId)
    .eq("expert_id", kullanici.id)
    .eq("status", "pending")
    .select("id, client_id, expert_id")
    .maybeSingle();

  if (basvuru && karar === "accepted") {
    // Konusma tablosuna kullanicilar yazamaz; sunucu, kabul edilmis basvuru icin acar.
    // Veritabani da basvurunun gercekten kabul edildigini ayrica kontrol eder.
    await supabaseYonetici()
      .from("conversations")
      .insert({
        application_id: basvuru.id,
        client_id: basvuru.client_id,
        expert_id: basvuru.expert_id,
        wrapped_key: await yeniKonusmaAnahtari(basvuru.id),
      });
  }

  revalidatePath("/panel");
}
