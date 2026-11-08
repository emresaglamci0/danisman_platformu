import "server-only";
import { cache } from "react";
import { supabaseAyarlari } from "./supabase/ayarlar";
import { supabaseYonetici } from "./supabase/yonetici";

// Hata icerigi log'a yazilmaz; hatada guvenli bos deger doner.
export const danisanPuanDurumu = async (
  danisanId: string,
  uzmanId: string,
): Promise<{ puanVerebilir: boolean; puanim: number | null }> => {
  const bos = { puanVerebilir: false, puanim: null };
  if (!supabaseAyarlari()) return bos;
  try {
    const { data, error } = await supabaseYonetici().rpc("danisan_puan_durumu", {
      p_danisan: danisanId,
      p_uzman: uzmanId,
    });
    const satir = data?.[0];
    if (error || !satir) return bos;
    return { puanVerebilir: !!satir.puan_verebilir, puanim: satir.puanim ?? null };
  } catch {
    return bos; // gizli anahtar eksikse sayfa bozulmasın
  }
};

export const bekleyenDegerlendirme = cache(
  async (danisanId: string): Promise<{ uzmanId: string; uzmanAdi: string } | null> => {
    if (!supabaseAyarlari()) return null;
    try {
      const { data, error } = await supabaseYonetici().rpc("bekleyen_degerlendirme", { p_danisan: danisanId });
      const satir = data?.[0];
      if (error || !satir) return null;
      return { uzmanId: satir.expert_id, uzmanAdi: satir.display_name };
    } catch {
      return null; // gizli anahtar eksikse sayfa bozulmasın
    }
  },
);
