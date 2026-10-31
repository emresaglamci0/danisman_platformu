import { ACIK_RIZA_SURUMU, KVKK_SURUMU } from "./sabitler";
import { supabaseSunucu } from "./supabase/sunucu";

export type Konusma = {
  id: string;
  application_id: string;
  client_id: string;
  expert_id: string;
  wrapped_key: string;
  created_at: string;
  danisanAdi: string;
  uzmanAdi: string;
};

const SORGU = "id, application_id, client_id, expert_id, wrapped_key, created_at, profiles(full_name), expert_profiles(display_name)";

type Satir = Omit<Konusma, "danisanAdi" | "uzmanAdi"> & {
  profiles: { full_name: string } | null;
  expert_profiles: { display_name: string } | null;
};

function donustur({ profiles, expert_profiles, ...k }: Satir): Konusma {
  return {
    ...k,
    danisanAdi: profiles?.full_name ?? "Danışan",
    uzmanAdi: expert_profiles?.display_name ?? "Uzman",
  };
}

// Veritabani kurallari (RLS) yalnizca iki tarafa ve admin'e satir dondurur.
export async function konusmalariGetir(): Promise<Konusma[]> {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("conversations").select(SORGU).order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Satir[]).map(donustur);
}

export async function konusmaGetir(id: string): Promise<Konusma | null> {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("conversations").select(SORGU).eq("id", id).maybeSingle();
  return data ? donustur(data as unknown as Satir) : null;
}

// Kullanici guncel aydinlatma metnini ve acik riza metnini onaylamis mi?
export async function mesajlasmaRizasiVar(kullaniciId: string) {
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("consents")
    .select("document, version")
    .eq("user_id", kullaniciId)
    .in("document", ["kvkk_aydinlatma", "acik_riza_mesajlasma"]);
  const onaylar = data ?? [];
  return (
    onaylar.some((o) => o.document === "kvkk_aydinlatma" && o.version === KVKK_SURUMU) &&
    onaylar.some((o) => o.document === "acik_riza_mesajlasma" && o.version === ACIK_RIZA_SURUMU)
  );
}
