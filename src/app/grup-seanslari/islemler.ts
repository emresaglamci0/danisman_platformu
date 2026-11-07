"use server";

import { revalidatePath } from "next/cache";
import { GORUSME_BAGLANTISI_EN_FAZLA, gorusmeBaglantisiGecerli } from "@/lib/gorusme";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { ACIK_RIZA_SURUMU, ALANLAR, KVKK_SURUMU, listedeMi } from "@/lib/sabitler";
import { odemeKalibiVar, saatIso, ucretGecerli } from "@/lib/seans-kurallari";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { supabaseYonetici } from "@/lib/supabase/yonetici";
import { odemeModuluAktif } from "@/modules/odeme/ayar";

const HATALAR: Record<string, string> = {
  SAAT_DOLU: "Bu saatte başka bir plan veya seansınız var. Lütfen başka bir saat seçin.",
  SAAT_GECERSIZ: "Saat, önümüzdeki 4 hafta içinde 08:00-21:00 arasında bir saat başı olmalı ve en az 12 saat sonra başlamalı.",
  UCRET_GECERSIZ: "Ücret 1 ile 10.000 ₺ arasında tam sayı olmalı.",
  UZMAN_ONAYSIZ: "Uzman onayınız geçerli olmadığı için grup seansı açamazsınız.",
  SURE_YOK: "Önce görüşme bilgilerinizden online görüşmeyi ve seans süresini belirtin.",
  HIZ_SINIRI: "Son 24 saatte çok fazla grup seansı açtınız. Lütfen daha sonra tekrar deneyin.",
  YETKI_YOK: "Bu işlem için yetkiniz yok.",
  KATILIM_KAPALI: "Bu seansa katılım kapandı.",
  KONTENJAN_DOLU: "Bu seansın kontenjanı doldu.",
  ZATEN_KAYITLI: "Bu seansa daha önce kaydoldunuz, yeniden katılamazsınız.",
  DURUM_GECERSIZ: "Bu işlem artık yapılamıyor. Lütfen sayfayı yenileyin.",
};

function hataMesaji(mesaj: string) {
  const kod = Object.keys(HATALAR).find((k) => mesaj.includes(k));
  return kod ? HATALAR[kod] : "İşlem yapılamadı. Lütfen tekrar deneyin.";
}

export async function grupAc(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  // Ogrenci uzman grup seansi acamaz (kullanici karari); veritabani da reddeder
  if (kullanici?.rol !== "expert") return { hata: HATALAR.YETKI_YOK };

  const konu = form.get("konu");
  const amac = String(form.get("amac") ?? "").trim();
  const tarih = String(form.get("tarih") ?? "");
  const saat = Number(form.get("saat"));
  const ucret = ucretGecerli(String(form.get("ucret") ?? "").trim());

  if (!listedeMi(ALANLAR, konu)) return { hata: "Lütfen konuyu seçin." };
  if (amac.length < 10 || amac.length > 500) return { hata: "Amaç 10 ile 500 karakter arasında olmalı." };
  // Amac herkese acik: buradan site disina yonlendirme yapilamasin
  if (odemeKalibiVar(amac)) return { hata: "Amaç metnine telefon numarası veya IBAN yazılamaz." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih) || !Number.isInteger(saat)) return { hata: "Lütfen tarih ve saat seçin." };
  if (ucret === null) return { hata: HATALAR.UCRET_GECERSIZ };

  const { error } = await supabaseYonetici().rpc("grup_ac", {
    p_uzman: kullanici.id,
    p_baslangic: saatIso(tarih, saat),
    p_konu: konu,
    p_amac: amac,
    p_ucret_kurus: ucret * 100,
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath("/panel");
  revalidatePath("/grup-seanslari");
  return { basari: "Grup seansınız açıldı." };
}

export async function grupIptalEt(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (kullanici?.rol !== "expert") return { hata: HATALAR.YETKI_YOK };

  const { error } = await supabaseYonetici().rpc("grup_iptal", {
    p_grup: String(form.get("grupId") ?? ""),
    p_uzman: kullanici.id,
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath("/panel");
  revalidatePath("/grup-seanslari");
  return {};
}

// Yer, odemeyle ayni islemde ayrilir. Grup seansinda sohbet olmadigi icin onay burada alinir.
export async function grupKatil(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };
  if (kullanici.rol !== "client") return { hata: "Yalnızca danışan hesapları katılabilir." };
  if (form.get("onay") !== "on") return { hata: "Katılmak için onay kutusunu işaretlemelisiniz." };

  const grupId = String(form.get("grupId") ?? "");
  const supabase = await supabaseSunucu();
  const { error: onayHatasi } = await supabase.from("consents").insert([
    { user_id: kullanici.id, document: "kvkk_aydinlatma", version: KVKK_SURUMU },
    { user_id: kullanici.id, document: "acik_riza_grup", version: ACIK_RIZA_SURUMU },
  ]);
  if (onayHatasi) return { hata: "Onayınız kaydedilemedi. Lütfen tekrar deneyin." };

  const { error } = await supabaseYonetici().rpc("grup_katil", {
    p_grup: grupId,
    p_danisan: kullanici.id,
    p_odeme_aktif: odemeModuluAktif(),
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath(`/grup-seanslari/${grupId}`);
  revalidatePath("/panel");
  return { basari: "Yeriniz ayrıldı." };
}

export async function grupAyril(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const grupId = String(form.get("grupId") ?? "");
  const { error } = await supabaseYonetici().rpc("grup_ayril", { p_grup: grupId, p_danisan: kullanici.id });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath(`/grup-seanslari/${grupId}`);
  revalidatePath("/panel");
  return {};
}

export async function grupBaglantisiKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (kullanici?.rol !== "expert") return { hata: HATALAR.YETKI_YOK };

  const baglanti = String(form.get("baglanti") ?? "").trim();
  if (!gorusmeBaglantisiGecerli(baglanti)) {
    return {
      hata: `Yalnızca Google Meet, Zoom veya Microsoft Teams bağlantısı ekleyebilirsiniz (https ile başlamalı, en fazla ${GORUSME_BAGLANTISI_EN_FAZLA} karakter).`,
    };
  }

  const { data, error } = await supabaseYonetici()
    .from("group_sessions")
    .update({ meeting_url: baglanti })
    .eq("id", String(form.get("grupId") ?? ""))
    .eq("expert_id", kullanici.id)
    .eq("status", "open")
    .gt("ends_at", new Date().toISOString())
    .select("id");
  if (error || !data?.length) return { hata: "Bağlantı kaydedilemedi. Lütfen sayfayı yenileyin." };

  revalidatePath("/panel");
  return { basari: "Bağlantı katılımcılarla paylaşıldı." };
}
