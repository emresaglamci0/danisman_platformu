import { supabaseSunucu } from "./supabase/sunucu";

export type SeansDurumu =
  | "sent"
  | "awaiting_payment"
  | "confirmed"
  | "rejected"
  | "withdrawn"
  | "expired"
  | "cancelled";

export type Seans = {
  id: string;
  conversation_id: string;
  starts_at: string;
  ends_at: string;
  price_kurus: number | null;
  status: SeansDurumu;
  expires_at: string | null;
  meeting_url: string | null;
  cancelled_by: "client" | "expert" | "system" | null;
};

export const SEANS_DURUMLARI: Record<SeansDurumu, string> = {
  sent: "Yanıt bekliyor",
  awaiting_payment: "Ödeme bekliyor",
  confirmed: "Kesinleşti",
  rejected: "Reddedildi",
  withdrawn: "Geri çekildi",
  expired: "Süresi doldu",
  cancelled: "İptal edildi",
};

// Veritabani kurallari yalnizca sohbetin iki tarafina satir dondurur (0016).
// Suresi gecen kayit, bakim isi henuz guncellemediyse de "suresi doldu" gosterilir.
export async function seanslariGetir(konusmaId: string): Promise<Seans[]> {
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("session_offers")
    .select("id, conversation_id, starts_at, ends_at, price_kurus, status, expires_at, meeting_url, cancelled_by")
    .eq("conversation_id", konusmaId)
    .order("starts_at", { ascending: false });
  const simdi = Date.now();
  return ((data ?? []) as Seans[]).map((s) =>
    (s.status === "sent" || s.status === "awaiting_payment") && s.expires_at && new Date(s.expires_at).getTime() <= simdi
      ? { ...s, status: "expired" as const }
      : s,
  );
}
