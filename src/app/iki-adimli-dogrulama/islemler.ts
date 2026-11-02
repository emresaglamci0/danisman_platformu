"use server";

import { redirect } from "next/navigation";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

export type KurulumBilgisi = { hata?: string; faktorId?: string; qr?: string; gizliAnahtar?: string };

// Admin icin yeni bir dogrulama uygulamasi kaydi baslatir: QR kod ve elle girilecek anahtari dondurur.
export async function kurulumuBaslat(): Promise<KurulumBilgisi> {
  const kullanici = await mevcutKullanici();
  if (kullanici?.rol !== "admin") return { hata: "Bu işlem yalnızca yöneticiler içindir." };

  const supabase = await supabaseSunucu();
  const { data: faktorler } = await supabase.auth.mfa.listFactors();
  if ((faktorler?.totp ?? []).length > 0) {
    return { hata: "Bu hesapta zaten kurulu bir doğrulama uygulaması var." };
  }
  // Yarim kalmis (dogrulanmamis) eski kurulum denemelerini temizle
  for (const f of faktorler?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Yonetici ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) return { hata: "Kurulum başlatılamadı. Supabase'de TOTP'nin açık olduğundan emin olun." };

  return { faktorId: data.id, qr: data.totp.qr_code, gizliAnahtar: data.totp.secret };
}

// Uygulamadaki 6 haneli kodu dogrular. Basariliysa oturum "aal2" seviyesine yukselir.
// Hem ilk kurulumun tamamlanmasinda hem de her giristen sonraki dogrulamada kullanilir.
export async function koduDogrula(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (kullanici?.rol !== "admin") return { hata: "Bu işlem yalnızca yöneticiler içindir." };

  const faktorId = String(form.get("faktorId") ?? "");
  const kod = String(form.get("kod") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(kod)) return { hata: "Lütfen uygulamadaki 6 haneli kodu girin." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: faktorId, code: kod });
  if (error) return { hata: "Kod hatalı veya süresi geçmiş. Uygulamadaki güncel kodu girin." };

  redirect("/admin");
}
