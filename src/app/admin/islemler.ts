"use server";

import { revalidatePath } from "next/cache";
import type { FormDurumu } from "@/lib/hatalar";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { BELGE_DEPOSU, FOTOGRAF_DEPOSU, supabaseYonetici } from "@/lib/supabase/yonetici";
import { adminKullanici, islemKaydet } from "./yetki";

const TARIH = /^\d{4}-\d{2}-\d{2}$/;

export async function uzmanOnayla(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const admin = await adminKullanici();
  if (!admin) return { hata: "Bu işlem için yetkiniz yok." };

  const uzmanId = String(form.get("uzmanId") ?? "");
  const supabase = await supabaseSunucu();
  const { data: uzman } = await supabase.from("expert_profiles").select("kind").eq("id", uzmanId).single();
  if (!uzman) return { hata: "Uzman bulunamadı." };

  // Ogrenci belgesi donemlik oldugu icin onayin bir bitis tarihi olmali
  let gecerlilik: string | null = null;
  if (uzman.kind === "student") {
    gecerlilik = String(form.get("gecerlilik") ?? "");
    const bugun = new Date().toISOString().slice(0, 10);
    if (!TARIH.test(gecerlilik) || gecerlilik <= bugun) {
      return { hata: "Öğrenci için ileri bir onay geçerlilik tarihi seçin." };
    }
  }

  const { error } = await supabase
    .from("expert_profiles")
    .update({
      status: "approved",
      review_note: null,
      reviewed_at: new Date().toISOString(),
      verified_until: gecerlilik,
    })
    .eq("id", uzmanId);
  if (error) return { hata: "Onaylanamadı. Lütfen tekrar deneyin." };

  await belgeDosyalariniSil(uzmanId);
  await islemKaydet(admin.id, "uzman_onayla", uzmanId);
  revalidatePath("/admin");
  return { basari: "Uzman onaylandı." };
}

export async function uzmanReddet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const admin = await adminKullanici();
  if (!admin) return { hata: "Bu işlem için yetkiniz yok." };

  const uzmanId = String(form.get("uzmanId") ?? "");
  const sebep = String(form.get("sebep") ?? "").trim();
  if (sebep.length < 5 || sebep.length > 500) {
    return { hata: "Ret sebebi 5 ile 500 karakter arasında olmalı." };
  }

  const supabase = await supabaseSunucu();
  const { error } = await supabase
    .from("expert_profiles")
    .update({ status: "rejected", review_note: sebep, reviewed_at: new Date().toISOString() })
    .eq("id", uzmanId);
  if (error) return { hata: "Reddedilemedi. Lütfen tekrar deneyin." };

  await belgeDosyalariniSil(uzmanId);
  await islemKaydet(admin.id, "uzman_reddet", uzmanId);
  revalidatePath("/admin");
  return { basari: "Uzman reddedildi; sebep uzmanın panelinde gösterilecek." };
}

export async function fotografKaldir(form: FormData) {
  const admin = await adminKullanici();
  if (!admin) return;

  const uzmanId = String(form.get("uzmanId") ?? "");
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("expert_profiles").select("photo_path").eq("id", uzmanId).single();
  if (!data?.photo_path) return;

  const { error } = await supabase.from("expert_profiles").update({ photo_path: null }).eq("id", uzmanId);
  if (error) return;
  await supabaseYonetici().storage.from(FOTOGRAF_DEPOSU).remove([data.photo_path]);
  await islemKaydet(admin.id, "foto_kaldir", uzmanId);
  revalidatePath("/admin");
}

// Karar verildikten sonra belge dosyalari silinir; sadece "hangi belge, ne zaman" kaydi kalir.
async function belgeDosyalariniSil(uzmanId: string) {
  const yonetici = supabaseYonetici();
  const { data } = await yonetici
    .from("expert_documents")
    .select("storage_path")
    .eq("expert_id", uzmanId)
    .not("storage_path", "is", null);
  const yollar = (data ?? []).map((b) => b.storage_path as string);
  if (yollar.length === 0) return;

  await yonetici.storage.from(BELGE_DEPOSU).remove(yollar);
  await yonetici.from("expert_documents").update({ storage_path: null }).eq("expert_id", uzmanId);
}
