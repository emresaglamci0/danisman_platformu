"use server";

import { revalidatePath } from "next/cache";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import type { FormDurumu } from "@/lib/hatalar";
import { ogrenciBasvurabilir } from "@/app/psikolojik-rahatsizliklar/kurallar";
import { ALANLAR, listedeMi } from "@/lib/sabitler";
import { uzmanGetir } from "@/lib/uzmanlar";

export async function basvuruYap(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await mevcutKullanici();
  if (!kullanici) return { hata: "Başvurmak için giriş yapın." };
  if (kullanici.rol !== "client") return { hata: "Yalnızca danışan hesapları başvuru yapabilir." };

  const uzmanId = String(form.get("uzmanId") ?? "");
  const konu = form.get("konu");
  const baslangic = new Date(String(form.get("baslangic") ?? ""));

  if (Number.isNaN(baslangic.getTime())) return { hata: "Lütfen takvimden bir saat seçin." };
  if (konu && !listedeMi(ALANLAR, konu)) return { hata: "Geçersiz konu seçimi." };

  // Yanit yalnizca burada okunur; kaydedilmez, loglanmaz.
  const uzman = await uzmanGetir(uzmanId);
  if (!uzman) return { hata: "Başvuru gönderilemedi. Lütfen tekrar deneyin." };
  if (!ogrenciBasvurabilir(uzman.kind === "student", form.get("ciddiDurum"))) {
    return { hata: "Bu görüşme öğrenci uzmanlar için uygun değil. Lütfen Uzmanlar sayfasından bir uzman seçin." };
  }

  const supabase = await supabaseSunucu();
  const { error } = await supabase.from("applications").insert({
    client_id: kullanici.id,
    expert_id: uzmanId,
    topic: konu || null,
    requested_start: baslangic.toISOString(),
  });

  if (error) {
    // 23505: ayni uzmana zaten bekleyen bir basvuru var
    if (error.code === "23505") return { hata: "Bu uzmana zaten yanıt bekleyen bir başvurunuz var." };
    if (error.message.includes("HIZ_SINIRI")) {
      return { hata: "Son 24 saatte çok fazla başvuru yaptınız. Lütfen daha sonra tekrar deneyin." };
    }
    if (error.message.includes("ALAN_OGRENCIYE_KAPALI")) {
      return { hata: "Bu konu öğrenci uzmanlar için uygun değil. Lütfen bağımsız bir uzman seçin." };
    }
    if (error.message.includes("SAAT_UYGUN_DEGIL")) {
      return { hata: "Bu saat artık uygun değil. Lütfen sayfayı yenileyip başka bir saat seçin." };
    }
    return { hata: "Başvuru gönderilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath("/panel");
  return { basari: "Başvurunuz gönderildi. Uzmanın yanıtını panelinizden takip edebilirsiniz." };
}
