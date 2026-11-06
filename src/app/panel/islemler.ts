"use server";

import { revalidatePath } from "next/cache";
import { mevcutKullanici } from "@/lib/oturum";
import { yeniKonusmaAnahtari } from "@/lib/sifreleme";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { supabaseYonetici } from "@/lib/supabase/yonetici";

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
