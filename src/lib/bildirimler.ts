import type { Kullanici } from "./oturum";
import { supabaseSunucu } from "./supabase/sunucu";

// Yalnizca sayi doner; mesaj icerigi veya konu bilgisi bildirimlerde kullanilmaz.
export async function okunmamisMesajlar(): Promise<Map<string, number>> {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.rpc("okunmamis_mesajlar");
  return new Map(
    ((data ?? []) as { konusma_id: string; adet: number }[]).map((s) => [s.konusma_id, Number(s.adet)]),
  );
}

export async function bildirimSayilari(kullanici: Kullanici) {
  if (kullanici.rol === "admin") return { mesaj: 0, panel: 0 };

  const supabase = await supabaseSunucu();
  // Uzman: yanit bekleyen basvurular. Danisan: yanitlanmis ama henuz gorulmemis basvurular.
  const basvurular = supabase.from("applications").select("id", { count: "exact", head: true });
  const { count } = await (kullanici.rol === "client"
    ? basvurular.eq("client_id", kullanici.id).neq("status", "pending").is("client_seen_at", null)
    : basvurular.eq("expert_id", kullanici.id).eq("status", "pending"));

  const mesajlar = await okunmamisMesajlar();
  return { mesaj: [...mesajlar.values()].reduce((a, b) => a + b, 0), panel: count ?? 0 };
}
