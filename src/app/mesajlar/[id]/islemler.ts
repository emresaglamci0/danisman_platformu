"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormDurumu } from "@/lib/hatalar";
import { konusmaGetir, mesajlasmaRizasiVar } from "@/lib/konusmalar";
import { mevcutKullanici } from "@/lib/oturum";
import { ACIK_RIZA_SURUMU, KVKK_SURUMU, MESAJ_EN_FAZLA, SIKAYET_KATEGORILERI, listedeMi } from "@/lib/sabitler";
import { mesajSifrele } from "@/lib/sifreleme";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { supabaseYonetici } from "@/lib/supabase/yonetici";

// Satir sonu ve sekme disindaki gorunmez kontrol karakterleri
const GORUNMEZ_KONTROL_KARAKTERI = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// Kullanici aydinlatma metnini okudugunu ve acik rizasini onaylar.
// Kayit: kullanici, tarih/saat (veritabani yazar) ve metin surumu.
export async function rizaVer(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };
  if (form.get("aydinlatma") !== "on" || form.get("acikRiza") !== "on") {
    return { hata: "Mesajlaşmak için iki onay kutusunu da işaretlemelisiniz." };
  }

  const supabase = await supabaseSunucu();
  const { error } = await supabase.from("consents").insert([
    { user_id: kullanici.id, document: "kvkk_aydinlatma", version: KVKK_SURUMU },
    { user_id: kullanici.id, document: "acik_riza_mesajlasma", version: ACIK_RIZA_SURUMU },
  ]);
  if (error) return { hata: "Onayınız kaydedilemedi. Lütfen tekrar deneyin." };

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return { basari: "Onayınız kaydedildi." };
}

export async function mesajGonder(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const konusma = await konusmaGetir(String(form.get("konusmaId") ?? ""));
  if (!konusma || (konusma.client_id !== kullanici.id && konusma.expert_id !== kullanici.id)) {
    return { hata: "Bu konuşmaya mesaj yazamazsınız." };
  }
  if (!(await mesajlasmaRizasiVar(kullanici.id))) {
    return { hata: "Mesaj yazmadan önce KVKK onayını vermelisiniz." };
  }

  // Acik metin kurallari: veritabani mesajin acik halini hic gormedigi icin burada kontrol edilir.
  const metin = String(form.get("metin") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!metin) return { hata: "Boş mesaj gönderilemez." };
  // [...metin] harf sayisini dogru sayar (emoji gibi karakterler 1 harf sayilir)
  if ([...metin].length > MESAJ_EN_FAZLA) return { hata: `Mesaj en fazla ${MESAJ_EN_FAZLA} karakter olabilir.` };
  if (GORUNMEZ_KONTROL_KARAKTERI.test(metin)) return { hata: "Mesajda geçersiz karakter var." };

  // Kullanicilarin mesaj tablosuna dogrudan yazma izni yok (0007). Mesaji yalnizca sunucu,
  // yukaridaki kontrollerden ve sifrelemeden sonra yazar. Veritabani da bicim, boyut,
  // taraf, onay ve hiz kurallarini ayrica uygular.
  const { error } = await supabaseYonetici().from("messages").insert({
    conversation_id: konusma.id,
    sender_id: kullanici.id,
    ciphertext: await mesajSifrele(konusma, metin),
  });
  if (error) {
    if (error.message.includes("HIZ_SINIRI")) {
      return { hata: "Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyip tekrar deneyin." };
    }
    return { hata: "Mesaj gönderilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/mesajlar/${konusma.id}`);
  return { basari: "gonderildi" };
}

// Taraflardan biri sohbeti sikayet eder. Bu, sohbeti yonetici incelemesine acar.
export async function sikayetEt(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const konusma = await konusmaGetir(String(form.get("konusmaId") ?? ""));
  if (!konusma || (konusma.client_id !== kullanici.id && konusma.expert_id !== kullanici.id)) {
    return { hata: "Bu sohbeti şikayet edemezsiniz." };
  }
  const kategori = form.get("kategori");
  const not = String(form.get("not") ?? "").trim();
  if (!listedeMi(SIKAYET_KATEGORILERI, kategori)) return { hata: "Lütfen bir şikayet sebebi seçin." };
  if (not.length > 500) return { hata: "Açıklama en fazla 500 karakter olabilir." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.from("conversation_flags").insert({
    conversation_id: konusma.id,
    source: "user_report",
    reported_by: kullanici.id,
    category: kategori,
    note: not || null,
  });
  if (error) {
    if (error.code === "23505") return { hata: "Bu sohbet için zaten açık bir şikayetiniz var." };
    return { hata: "Şikayetiniz kaydedilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/mesajlar/${konusma.id}`);
  return { basari: "Şikayetiniz alındı. Yetkili yönetici bu sohbeti inceleyebilecek." };
}

// Admin, isaretli bir sohbeti sebep yazarak 30 dakikaligina acar.
// Yetki, isaret ve sebep kontrolunu veritabani fonksiyonu yapar ve erisimi kaydeder.
export async function incelemeErisimiAc(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (kullanici?.rol !== "admin" || kullanici.aal !== "aal2") return { hata: "Bu işlem için yetkiniz yok." };

  const konusmaId = String(form.get("konusmaId") ?? "");
  const sebep = String(form.get("sebep") ?? "").trim();
  if (sebep.length < 10 || sebep.length > 500) return { hata: "Sebep 10 ile 500 karakter arasında olmalı." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.rpc("konusma_erisimi_ac", { p_konusma: konusmaId, p_sebep: sebep });
  if (error) {
    if (error.message.includes("ISARET_YOK")) return { hata: "Bu sohbette açık bir şikayet veya inceleme yok." };
    return { hata: "Erişim açılamadı. Lütfen tekrar deneyin." };
  }
  redirect(`/mesajlar/${konusmaId}`);
}
