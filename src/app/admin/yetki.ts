import "server-only";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

// Giris yapan kisi admin degilse null doner. Her admin islemi once bunu cagirir.
// Veritabani kurallari (RLS) da admin kontrolunu ayrica yapar.
export async function adminKullanici() {
  const kullanici = await mevcutKullanici();
  return kullanici?.rol === "admin" ? kullanici : null;
}

type Islem = "belge_goruntule" | "uzman_onayla" | "uzman_reddet" | "foto_kaldir";

// Admin islemlerini kaydeder: kim, ne zaman, hangi kayit uzerinde ne yapti
export async function islemKaydet(adminId: string, islem: Islem, hedefId: string) {
  const supabase = await supabaseSunucu();
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action: islem, target_id: hedefId });
}
