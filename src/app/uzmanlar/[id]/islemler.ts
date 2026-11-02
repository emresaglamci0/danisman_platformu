"use server";

import { revalidatePath } from "next/cache";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import type { FormDurumu } from "@/lib/hatalar";
import { ALANLAR, UYGUN_ZAMANLAR, listedeMi } from "@/lib/sabitler";

export async function basvuruYap(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Başvurmak için giriş yapın." };
  if (kullanici.rol !== "client") return { hata: "Yalnızca danışan hesapları başvuru yapabilir." };

  const uzmanId = String(form.get("uzmanId") ?? "");
  const konu = form.get("konu");
  const zaman = form.get("zaman");

  if (!listedeMi(UYGUN_ZAMANLAR, zaman)) return { hata: "Lütfen size uygun zamanı seçin." };
  if (konu && !listedeMi(ALANLAR, konu)) return { hata: "Geçersiz konu seçimi." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.from("applications").insert({
    client_id: kullanici.id,
    expert_id: uzmanId,
    topic: konu || null,
    availability: zaman,
  });

  if (error) {
    // 23505: ayni uzmana zaten bekleyen bir basvuru var
    if (error.code === "23505") return { hata: "Bu uzmana zaten yanıt bekleyen bir başvurunuz var." };
    if (error.message.includes("HIZ_SINIRI")) {
      return { hata: "Son 24 saatte çok fazla başvuru yaptınız. Lütfen daha sonra tekrar deneyin." };
    }
    return { hata: "Başvuru gönderilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath("/panel");
  return { basari: "Başvurunuz gönderildi. Uzmanın yanıtını panelinizden takip edebilirsiniz." };
}
