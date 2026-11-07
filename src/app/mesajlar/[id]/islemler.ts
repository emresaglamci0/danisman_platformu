"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormDurumu } from "@/lib/hatalar";
import { GORUSME_BAGLANTISI_EN_FAZLA, gorusmeBaglantisiGecerli } from "@/lib/gorusme";
import { konusmaGetir, mesajlasmaRizasiVar, uzmanSeansBilgisi } from "@/lib/konusmalar";
import { mevcutKullanici } from "@/lib/oturum";
import { ACIK_RIZA_SURUMU, KVKK_SURUMU, MESAJ_EN_FAZLA, SIKAYET_KATEGORILERI, listedeMi } from "@/lib/sabitler";
import { odemeKalibiVar } from "@/lib/seans-kurallari";
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
  if (!konusma.expert_id) return { hata: "Uzman platformdan ayrıldığı için bu sohbete mesaj yazılamaz." };
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
  const yonetici = supabaseYonetici();
  const { data: mesaj, error } = await yonetici
    .from("messages")
    .insert({
      conversation_id: konusma.id,
      sender_id: kullanici.id,
      ciphertext: await mesajSifrele(konusma, metin),
    })
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("HIZ_SINIRI")) {
      return { hata: "Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyip tekrar deneyin." };
    }
    return { hata: "Mesaj gönderilemedi. Lütfen tekrar deneyin." };
  }

  // Site disina odeme yonlendirmesi kontrolu: yalnizca bagimsiz uzmanin mesajlari (kullanici karari, 2026-11-07).
  // Mesaj engellenmez. Bulunan metin hicbir yere yazilmaz. Isaretleme basarisiz olursa mesaj yine gonderilmis olur;
  // ayni sohbette zaten acik otomatik isaret varsa veritabani ikincisini reddeder (0016).
  if (konusma.expert_id === kullanici.id && odemeKalibiVar(metin)) {
    const bilgi = await uzmanSeansBilgisi(kullanici.id);
    if (bilgi?.kind === "independent") {
      await yonetici.from("conversation_flags").insert({
        conversation_id: konusma.id,
        source: "auto_moderation",
        category: "site_disi_odeme",
        detector: "odeme_kaliplari_v1",
        message_id: mesaj.id,
      });
    }
  }

  revalidatePath(`/mesajlar/${konusma.id}`);
  return { basari: "gonderildi" };
}

// On gorusme baglantisi: yalnizca ucretsiz on gorusme yapan bagimsiz uzman, sohbet basina BIR KEZ yollar.
// Yalnizca izinli servislerin adresi kabul edilir. Kullanicilarin yazma izni yok; kaydi sunucu yapar (0014, 0016).
export async function gorusmeBaglantisiKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const konusma = await konusmaGetir(String(form.get("konusmaId") ?? ""));
  if (!konusma || konusma.expert_id !== kullanici.id) return { hata: "Bu işlemi yalnızca sohbetin uzmanı yapabilir." };
  if (konusma.meeting_url) return { hata: "Ön görüşme bağlantısı yalnızca bir kez yollanabilir." };

  const bilgi = await uzmanSeansBilgisi(kullanici.id);
  if (bilgi?.kind !== "independent" || !bilgi.offers_free_intro) {
    return { hata: "Bu bağlantı yalnızca ücretsiz ön görüşme yapan bağımsız uzmanlar içindir." };
  }

  const baglanti = String(form.get("baglanti") ?? "").trim();
  if (!gorusmeBaglantisiGecerli(baglanti)) {
    return {
      hata: `Yalnızca Google Meet, Zoom veya Microsoft Teams bağlantısı ekleyebilirsiniz (https ile başlamalı, en fazla ${GORUSME_BAGLANTISI_EN_FAZLA} karakter).`,
    };
  }

  const { error } = await supabaseYonetici()
    .from("conversations")
    .update({ meeting_url: baglanti })
    .eq("id", konusma.id)
    .eq("expert_id", kullanici.id);
  if (error) {
    if (error.message.includes("BAGLANTI_DEGISTIRILEMEZ")) {
      return { hata: "Ön görüşme bağlantısı yalnızca bir kez yollanabilir." };
    }
    return { hata: "Bağlantı kaydedilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/mesajlar/${konusma.id}`);
  return { basari: "Bağlantı danışanınızla paylaşıldı." };
}

// Danisan, uzmani ayrilmis sohbeti 6 ay dolmadan kendisi siler. Kurallari veritabani fonksiyonu uygular.
export async function ayrilanUzmanSohbetiniSil(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };
  if (form.get("onay") !== "on") return { hata: "Silmek için kutuyu işaretleyin." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.rpc("ayrilan_uzman_sohbetini_sil", {
    p_konusma: String(form.get("konusmaId") ?? ""),
  });
  if (error) {
    if (error.message.includes("ACIK_ISARET")) {
      return { hata: "Bu sohbette açık bir şikayet veya inceleme var. İşlem sonuçlanınca silebilirsiniz." };
    }
    return { hata: "Sohbet silinemedi. Lütfen tekrar deneyin." };
  }
  redirect("/mesajlar");
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
  if (kategori === "site_disi_odeme") {
    const bilgi = konusma.expert_id ? await uzmanSeansBilgisi(konusma.expert_id) : null;
    if (bilgi?.kind !== "independent") return { hata: "Bu sebep bu sohbet için geçerli değil." };
  }
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
    if (error.message.includes("HIZ_SINIRI")) {
      return { hata: "Son 24 saatte çok fazla şikayet gönderdiniz. Lütfen daha sonra tekrar deneyin." };
    }
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
