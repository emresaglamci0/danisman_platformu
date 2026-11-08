"use server";

import { revalidatePath } from "next/cache";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/yonetici";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENEL_HATA = "Puan kaydedilemedi. Lütfen tekrar deneyin.";

export async function puanVer(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Puan vermek için giriş yapın." };
  if (kullanici.rol !== "client") return { hata: "Yalnızca danışan hesapları puan verebilir." };

  const puan = Number(form.get("puan"));
  if (!Number.isInteger(puan) || puan < 1 || puan > 5) return { hata: "Lütfen 1 ile 5 arasında bir puan seçin." };

  const uzmanId = String(form.get("uzmanId") ?? "");
  if (!UUID.test(uzmanId)) return { hata: GENEL_HATA };

  const { error } = await supabaseYonetici().rpc("uzman_puanla", {
    p_danisan: kullanici.id,
    p_uzman: uzmanId,
    p_puan: puan,
  });
  if (error) {
    if (error.message.includes("PUAN_SARTI_YOK"))
      return { hata: "Puan verebilmek için bu uzmanla en az 2 görüşmeyi tamamlamış olmalısınız." };
    return { hata: GENEL_HATA };
  }

  revalidatePath("/uzmanlar");
  revalidatePath(`/uzmanlar/${uzmanId}`);
  return { basari: "✓ Puanınız kaydedildi. Teşekkürler!" };
}

export async function degerlendirmeyiErtele(uzmanId: string): Promise<void> {
  const kullanici = await mevcutKullanici();
  if (!kullanici || kullanici.rol !== "client" || !UUID.test(uzmanId)) return;
  await supabaseYonetici().rpc("degerlendirme_ertele", { p_danisan: kullanici.id, p_uzman: uzmanId });
}
