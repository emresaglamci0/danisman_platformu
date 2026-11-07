"use server";

import { revalidatePath } from "next/cache";
import { GORUSME_BAGLANTISI_EN_FAZLA, gorusmeBaglantisiGecerli } from "@/lib/gorusme";
import type { FormDurumu } from "@/lib/hatalar";
import { konusmaGetir, uzmanSeansBilgisi } from "@/lib/konusmalar";
import { mevcutKullanici } from "@/lib/oturum";
import { saatIso, ucretGecerli } from "@/lib/seans-kurallari";
import { supabaseYonetici } from "@/lib/supabase/yonetici";
import { odemeModuluAktif } from "@/modules/odeme/ayar";

const HATALAR: Record<string, string> = {
  SAAT_DOLU: "Bu saatte başka bir plan veya seansınız var. Lütfen başka bir saat seçin.",
  SAAT_GECERSIZ: "Saat, önümüzdeki 4 hafta içinde 08:00-21:00 arasında bir saat başı olmalı.",
  UCRET_GECERSIZ: "Ücret 1 ile 10.000 ₺ arasında tam sayı olmalı.",
  UZMAN_ONAYSIZ: "Uzman onayı geçerli olmadığı için bu işlem yapılamıyor.",
  SURE_YOK: "Önce panelinizden online görüşmeyi ve seans süresini belirtin.",
  SURE_DOLDU: "Bu planın süresi doldu.",
  HIZ_SINIRI: "Son 24 saatte çok fazla plan gönderdiniz. Lütfen daha sonra tekrar deneyin.",
  DURUM_GECERSIZ: "Bu işlem artık yapılamıyor. Lütfen sayfayı yenileyin.",
  BAGLANTI_DEGISTIRILEMEZ: "Ön görüşme bağlantısı yalnızca bir kez yollanabilir.",
};

function hataMesaji(mesaj: string) {
  const kod = Object.keys(HATALAR).find((k) => mesaj.includes(k));
  return kod ? HATALAR[kod] : "İşlem yapılamadı. Lütfen tekrar deneyin.";
}

const GUN = /^\d{4}-\d{2}-\d{2}$/;

export async function planGonder(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const konusma = await konusmaGetir(String(form.get("konusmaId") ?? ""));
  if (!konusma || !konusma.expert_id || konusma.expert_id !== kullanici.id) {
    return { hata: "Bu işlemi yalnızca sohbetin uzmanı yapabilir." };
  }

  const tarih = String(form.get("tarih") ?? "");
  const saat = Number(form.get("saat"));
  if (!GUN.test(tarih) || !Number.isInteger(saat)) return { hata: "Lütfen tarih ve saat seçin." };

  // Ogrenci uzmanda ucret hic okunmaz: bu kayit ucretsiz seans randevusudur
  const bilgi = await uzmanSeansBilgisi(kullanici.id);
  let ucretKurus: number | null = null;
  if (bilgi?.kind === "independent") {
    const ucret = ucretGecerli(String(form.get("ucret") ?? "").trim());
    if (ucret === null) return { hata: HATALAR.UCRET_GECERSIZ };
    ucretKurus = ucret * 100;
  }

  const { error } = await supabaseYonetici().rpc("plan_gonder", {
    p_konusma: konusma.id,
    p_uzman: kullanici.id,
    p_baslangic: saatIso(tarih, saat),
    p_ucret_kurus: ucretKurus,
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath(`/mesajlar/${konusma.id}`);
  return { basari: "Gönderildi. Saat 24 saat boyunca sizin için ayrıldı." };
}

export async function planYanitla(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const karar = form.get("karar");
  if (karar !== "onay" && karar !== "ret") return { hata: "Geçersiz işlem." };

  const { error } = await supabaseYonetici().rpc("plan_yanitla", {
    p_plan: String(form.get("planId") ?? ""),
    p_danisan: kullanici.id,
    p_karar: karar,
    p_odeme_aktif: odemeModuluAktif(),
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return {};
}

export async function planGeriCek(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const { error } = await supabaseYonetici().rpc("plan_geri_cek", {
    p_plan: String(form.get("planId") ?? ""),
    p_uzman: kullanici.id,
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return {};
}

export async function seansIptal(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const { error } = await supabaseYonetici().rpc("seans_iptal", {
    p_plan: String(form.get("planId") ?? ""),
    p_kullanici: kullanici.id,
  });
  if (error) return { hata: hataMesaji(error.message) };

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return {};
}

// Uzman kesinlesmis seansin gorusme baglantisini ekler veya degistirir.
export async function seansBaglantisiKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Lütfen giriş yapın." };

  const baglanti = String(form.get("baglanti") ?? "").trim();
  if (!gorusmeBaglantisiGecerli(baglanti)) {
    return {
      hata: `Yalnızca Google Meet, Zoom veya Microsoft Teams bağlantısı ekleyebilirsiniz (https ile başlamalı, en fazla ${GORUSME_BAGLANTISI_EN_FAZLA} karakter).`,
    };
  }

  const { data, error } = await supabaseYonetici()
    .from("session_offers")
    .update({ meeting_url: baglanti })
    .eq("id", String(form.get("planId") ?? ""))
    .eq("expert_id", kullanici.id)
    .eq("status", "confirmed")
    .gt("ends_at", new Date().toISOString())
    .select("id");
  if (error || !data?.length) return { hata: "Bağlantı kaydedilemedi. Lütfen sayfayı yenileyin." };

  revalidatePath(`/mesajlar/${String(form.get("konusmaId") ?? "")}`);
  return { basari: "Bağlantı danışanınızla paylaşıldı." };
}
