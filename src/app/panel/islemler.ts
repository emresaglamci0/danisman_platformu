"use server";

import { revalidatePath } from "next/cache";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

// Uzman bir basvuruyu kabul eder veya reddeder.
// Veritabani kurallari (RLS) da yalnizca ilgili uzmanin, yalnizca bekleyen basvuruyu
// degistirmesine izin verir.
export async function basvuruYanitla(form: FormData) {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) return;

  const basvuruId = String(form.get("basvuruId") ?? "");
  const karar = form.get("karar");
  if (karar !== "accepted" && karar !== "rejected") return;

  const supabase = await supabaseSunucu();
  await supabase
    .from("applications")
    .update({ status: karar })
    .eq("id", basvuruId)
    .eq("expert_id", kullanici.id)
    .eq("status", "pending");

  revalidatePath("/panel");
}
