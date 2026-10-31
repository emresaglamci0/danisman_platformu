"use server";

import { revalidatePath } from "next/cache";
import type { FormDurumu } from "@/lib/hatalar";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { adminKullanici } from "../yetki";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Admin, sohbet kimligini bildigi bir sohbeti (orn. e-postayla gelen bildirim uzerine)
// sebep yazarak incelemeye alir. Bu islem mesajlari acmaz.
export async function incelemeyeAl(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!(await adminKullanici())) return { hata: "Bu işlem için yetkiniz yok." };

  const konusmaId = String(form.get("konusmaId") ?? "").trim();
  const sebep = String(form.get("sebep") ?? "").trim();
  if (!UUID.test(konusmaId)) return { hata: "Geçerli bir sohbet kimliği girin." };
  if (sebep.length < 10 || sebep.length > 500) return { hata: "Sebep 10 ile 500 karakter arasında olmalı." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.rpc("incelemeye_al", { p_konusma: konusmaId, p_sebep: sebep });
  if (error) {
    if (error.message.includes("SOHBET_YOK")) return { hata: "Bu kimlikte bir sohbet bulunamadı." };
    return { hata: "İncelemeye alınamadı. Lütfen tekrar deneyin." };
  }

  revalidatePath("/admin/incelemeler");
  return { basari: "Sohbet incelemeye alındı. Açmak için listeden “İncele”ye tıklayın." };
}

export async function isaretKapat(form: FormData) {
  if (!(await adminKullanici())) return;
  const supabase = await supabaseSunucu();
  await supabase.rpc("isaret_kapat", { p_isaret: String(form.get("isaretId") ?? "") });
  revalidatePath("/admin/incelemeler");
}
