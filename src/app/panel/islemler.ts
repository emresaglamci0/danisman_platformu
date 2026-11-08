"use server";

import { revalidatePath } from "next/cache";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { ILLER } from "@/lib/iller";
import { TANITIM_EN_FAZLA, alanlariSuz } from "@/lib/sabitler";
import { SAAT_ILK, SAAT_SON, SEANS_SURELERI } from "@/lib/seans-kurallari";
import { yeniKonusmaAnahtari } from "@/lib/sifreleme";
import { supabaseYonetici } from "@/lib/supabase/yonetici";

// Uzman tanitim yazisini ve calisma alanlarini gunceller. Ad ve unvan belgelerle dogrulandigi icin
// burada degistirilemez. Uzmanlarin tabloya yazma izni yok; sunucu yalnizca bu iki alani degistirir.
export async function profilGuncelle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) {
    return { hata: "Bu işlem yalnızca uzman hesapları içindir." };
  }

  const tanitim = String(form.get("tanitim") ?? "").trim();
  const alanlar = alanlariSuz(form.getAll("alanlar"), kullanici.rol === "student_expert");
  if (tanitim.length > TANITIM_EN_FAZLA) return { hata: `Tanıtım yazısı en fazla ${TANITIM_EN_FAZLA} karakter olabilir.` };
  if (alanlar.length === 0) return { hata: "En az bir çalışma alanı seçin." };

  const yonetici = supabaseYonetici();
  const { data: eski } = await yonetici.from("expert_profiles").select("bio").eq("id", kullanici.id).single();
  // Yazi degistiyse yayinlanir ve yoneticinin sonradan kontrol listesine duser (0015)
  const yaziDegisti = (eski?.bio ?? "") !== tanitim;
  const { error } = await yonetici
    .from("expert_profiles")
    .update({
      bio: tanitim || null,
      specialties: alanlar,
      ...(yaziDegisti && { bio_needs_review: !!tanitim, bio_updated_at: new Date().toISOString() }),
    })
    .eq("id", kullanici.id);
  if (error?.message.includes("ALAN_OGRENCIYE_KAPALI")) {
    return { hata: "Seçtiğiniz alanlardan bazıları öğrenci uzmanlar için uygun değil." };
  }
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

// Uzman gorusme seklini, yuz yuze konumunu ve seans suresini kaydeder (0016).
export async function gorusmeBilgileriKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) {
    return { hata: "Bu işlem yalnızca uzman hesapları içindir." };
  }

  const online = form.get("online") === "on";
  const yuzYuze = form.get("yuzYuze") === "on";
  const il = String(form.get("il") ?? "");
  const ilce = String(form.get("ilce") ?? "").trim();
  const sure = Number(form.get("sure"));

  if (!online && !yuzYuze) return { hata: "En az bir görüşme şekli seçin." };
  if (!(SEANS_SURELERI as readonly number[]).includes(sure)) return { hata: "Lütfen seans süresini seçin." };
  if (yuzYuze) {
    if (!ILLER.includes(il)) return { hata: "Lütfen şehir seçin." };
    // Yalnizca harf ve bosluk: buraya telefon veya acik adres yazilamasin
    if (!/^[\p{L} ]{1,40}$/u.test(ilce)) return { hata: "İlçe yalnızca harflerden oluşmalı (en fazla 40 karakter)." };
  }

  const { error } = await supabaseYonetici()
    .from("expert_profiles")
    .update({
      offers_online: online,
      offers_in_person: yuzYuze,
      city: yuzYuze ? il : null,
      district: yuzYuze ? ilce : null,
      session_minutes: sure,
    })
    .eq("id", kullanici.id);
  if (error) return { hata: "Bilgileriniz kaydedilemedi. Lütfen tekrar deneyin." };

  revalidatePath("/panel");
  return { basari: "Görüşme bilgileriniz güncellendi." };
}

// Uzman haftalik uygun saatlerini kaydeder. Once yeniler eklenir, sonra kaldirilanlar silinir:
// yarida hata olursa uzmanin tum saatleri kaybolmaz.
export async function haftalikDuzenKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) {
    return { hata: "Bu işlem yalnızca uzman hesapları içindir." };
  }

  const satirlar = [];
  for (const deger of new Set(form.getAll("saat"))) {
    const [gun, saat] = String(deger).split("-").map(Number);
    if (!(gun >= 1 && gun <= 7) || !(saat >= SAAT_ILK && saat <= SAAT_SON)) return { hata: "Geçersiz saat seçimi." };
    satirlar.push({ expert_id: kullanici.id, weekday: gun, hour: saat });
  }

  const yonetici = supabaseYonetici();
  const { data: mevcut, error: okumaHatasi } = await yonetici
    .from("expert_availability")
    .select("weekday, hour")
    .eq("expert_id", kullanici.id);
  if (okumaHatasi) return { hata: "Saatleriniz kaydedilemedi. Lütfen tekrar deneyin." };

  if (satirlar.length > 0) {
    const { error } = await yonetici.from("expert_availability").upsert(satirlar);
    if (error) return { hata: "Saatleriniz kaydedilemedi. Lütfen tekrar deneyin." };
  }
  for (const eski of mevcut ?? []) {
    if (satirlar.some((s) => s.weekday === eski.weekday && s.hour === eski.hour)) continue;
    const { error } = await yonetici
      .from("expert_availability")
      .delete()
      .match({ expert_id: kullanici.id, weekday: eski.weekday, hour: eski.hour });
    if (error) return { hata: "Saatleriniz kaydedilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath("/panel");
  return { basari: "Uygun saatleriniz güncellendi." };
}

// Uzman bir basvuruyu kabul eder veya reddeder. Kullanicilarin basvuru tablosuna yazma izni yok (0016).
// Kabulde basvuru, sohbet ve (ogrenci uzmanda) seans veritabaninda tek islemde olusur.
export async function basvuruYanitla(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) {
    return { hata: "Bu işlem yalnızca uzman hesapları içindir." };
  }

  const basvuruId = String(form.get("basvuruId") ?? "");
  const karar = form.get("karar");
  const yonetici = supabaseYonetici();

  if (karar === "rejected") {
    const { error } = await yonetici
      .from("applications")
      .update({ status: "rejected" })
      .eq("id", basvuruId)
      .eq("expert_id", kullanici.id)
      .eq("status", "pending");
    if (error) return { hata: "İşlem yapılamadı. Lütfen tekrar deneyin." };
  } else if (karar === "accepted") {
    const { error } = await yonetici.rpc("basvuru_kabul", {
      p_basvuru: basvuruId,
      p_uzman: kullanici.id,
      p_sarili_anahtar: await yeniKonusmaAnahtari(basvuruId),
    });
    if (error) {
      if (error.message.includes("SAAT_DOLU")) {
        return { hata: "Bu saat artık uygun değil, başvuruyu kabul edemezsiniz. Reddedebilirsiniz." };
      }
      if (error.message.includes("UZMAN_ONAYSIZ")) {
        return { hata: "Hesabınız onaylı olmadığı için başvuru kabul edemezsiniz." };
      }
      return { hata: "İşlem yapılamadı. Lütfen tekrar deneyin." };
    }
  } else {
    return { hata: "Geçersiz işlem." };
  }

  revalidatePath("/panel");
  return {};
}
