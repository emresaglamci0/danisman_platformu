"use server";

import { revalidatePath } from "next/cache";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/yonetici";
import { odemeModuluAktif } from "./ayar";

// Demo: para cekilmez, kart bilgisi alinmaz. Yalnizca kayit tutulur (0017).
export async function demoOdemeYap(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };
  if (!odemeModuluAktif()) return { hata: "Ödeme şu anda kullanılamıyor." };

  const { error } = await supabaseYonetici().rpc("demo_odeme_yap", {
    p_plan: String(form.get("planId") ?? ""),
    p_danisan: kullanici.id,
  });
  if (error) return { hata: "Ödeme tamamlanamadı. Planın süresi dolmuş olabilir." };

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return { basari: "Demo ödeme tamamlandı, seansınız kesinleşti." };
}

export async function seansYapilmadiBildir(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };
  if (!odemeModuluAktif()) return { hata: "Bu işlem şu anda kullanılamıyor." };

  const { error } = await supabaseYonetici().rpc("seans_yapilmadi_bildir", {
    p_plan: String(form.get("planId") ?? ""),
    p_danisan: kullanici.id,
  });
  if (error) {
    if (error.message.includes("HIZ_SINIRI")) {
      return { hata: "Son 24 saatte çok fazla şikayet gönderdiniz. Lütfen daha sonra tekrar deneyin." };
    }
    return { hata: "Bildiriminiz alınamadı. Bildirim süresi dolmuş olabilir." };
  }

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return { basari: "Bildiriminiz alındı. Ödemeniz yönetici kararına kadar bekletilecek." };
}
