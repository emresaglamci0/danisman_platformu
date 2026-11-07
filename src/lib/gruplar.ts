import { supabaseAyarlari } from "./supabase/ayarlar";
import { supabaseSunucu } from "./supabase/sunucu";
import type { Alan } from "./sabitler";

export const GRUP_EN_AZ = 3;
export const GRUP_EN_FAZLA = 12;

export type GrupVitrin = {
  id: string;
  expert_id: string;
  display_name: string;
  topic: Alan;
  purpose: string;
  starts_at: string;
  ends_at: string;
  price_kurus: number;
  katilimci: number;
};

const SORGU = "id, expert_id, display_name, topic, purpose, starts_at, ends_at, price_kurus, katilimci";

// Herkese acik "grup_vitrini" gorunumu (0018): gorusme baglantisi ve katilimci adi icermez.
export async function acikGruplar(uzmanId?: string): Promise<GrupVitrin[]> {
  if (!supabaseAyarlari()) return [];
  const supabase = await supabaseSunucu();
  let sorgu = supabase.from("grup_vitrini").select(SORGU).order("starts_at");
  if (uzmanId) sorgu = sorgu.eq("expert_id", uzmanId);
  const { data } = await sorgu;
  return (data ?? []) as GrupVitrin[];
}

export async function acikGrup(id: string): Promise<GrupVitrin | null> {
  if (!supabaseAyarlari()) return null;
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("grup_vitrini").select(SORGU).eq("id", id).maybeSingle();
  return data as GrupVitrin | null;
}
