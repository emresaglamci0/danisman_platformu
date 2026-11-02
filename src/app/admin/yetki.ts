import "server-only";
import { notFound, redirect } from "next/navigation";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

// Giris yapan kisi, iki adimli dogrulamadan (TOTP) gecmis bir admin degilse null doner.
// Her admin islemi once bunu cagirir. Veritabani (my_role) da ayni kurali ayrica uygular.
export async function adminKullanici() {
  const kullanici = await mevcutKullanici();
  return kullanici?.rol === "admin" && kullanici.aal === "aal2" ? kullanici : null;
}

// Admin sayfalarinin basinda cagrilir:
// - admin degilse sayfa "bulunamadi" gorunur,
// - admin ama kod girmemisse iki adimli dogrulama sayfasina yonlendirilir.
export async function adminSayfasiniKoru() {
  const kullanici = await mevcutKullanici();
  if (kullanici?.rol !== "admin") notFound();
  if (kullanici.aal !== "aal2") redirect("/iki-adimli-dogrulama");
  return kullanici;
}

type Islem = "belge_goruntule" | "uzman_onayla" | "uzman_reddet" | "foto_kaldir" | "mesaj_goruntule";

// Admin islemlerini kaydeder: kim, ne zaman, hangi kayit uzerinde ne yapti
export async function islemKaydet(adminId: string, islem: Islem, hedefId: string) {
  const supabase = await supabaseSunucu();
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: islem, target_id: hedefId });
}
