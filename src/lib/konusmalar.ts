import { ACIK_RIZA_SURUMU, KVKK_SURUMU } from "./sabitler";
import { supabaseSunucu } from "./supabase/sunucu";
import { supabaseYonetici } from "./supabase/yonetici";
import { uzmanAdlari } from "./uzmanlar";

export type Konusma = {
  id: string;
  application_id: string;
  client_id: string;
  expert_id: string | null; // uzman hesabini silmisse bos (0013)
  expert_left_at: string | null;
  meeting_url: string | null;
  wrapped_key: string;
  created_at: string;
  danisanAdi: string;
  uzmanAdi: string;
};

// Uzman adi asil tablodan degil, herkese acik vitrinden okunur (bkz. uzmanAdlari)
const SORGU =
  "id, application_id, client_id, expert_id, expert_left_at, meeting_url, wrapped_key, created_at, profiles(full_name)";

type Satir = Omit<Konusma, "danisanAdi" | "uzmanAdi"> & { profiles: { full_name: string } | null };

async function donustur(satirlar: Satir[]): Promise<Konusma[]> {
  const adlar = await uzmanAdlari(satirlar.flatMap((s) => s.expert_id ?? []));
  return satirlar.map(({ profiles, ...k }) => ({
    ...k,
    danisanAdi: profiles?.full_name ?? "Danışan",
    uzmanAdi: k.expert_id ? (adlar.get(k.expert_id) ?? "Uzman") : "Ayrılan uzman",
  }));
}

// Uzman ayrildiktan sonra sohbetin otomatik silinecegi tarih (veritabanindaki 6 ay kuraliyla ayni, 0013)
export function sohbetSilinmeTarihi(uzmanAyrilma: string) {
  const tarih = new Date(uzmanAyrilma);
  tarih.setMonth(tarih.getMonth() + 6);
  return tarih.toISOString();
}

// Veritabani kurallari (RLS) yalnizca iki tarafa ve (isaretli sohbetlerde) admin'e satir dondurur.
export async function konusmalariGetir(): Promise<Konusma[]> {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("conversations").select(SORGU).order("created_at", { ascending: false });
  return donustur((data ?? []) as unknown as Satir[]);
}

export async function konusmaGetir(id: string): Promise<Konusma | null> {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("conversations").select(SORGU).eq("id", id).maybeSingle();
  if (!data) return null;
  const [konusma] = await donustur([data as unknown as Satir]);
  return konusma;
}

// Danisan asil uzman tablosunu okuyamaz; vitrinde de belgesi suresi dolan uzman gorunmez. Bu yuzden
// gizli anahtarla okunur. Yalnizca sohbetin tarafi oldugu dogrulanan kullanici icin cagrilmalidir.
// Okunamazsa null doner: ogrenci sohbetinde odeme uyarisi cikmasindansa uyari hic cikmaz.
export async function uzmanSeansBilgisi(uzmanId: string) {
  const { data } = await supabaseYonetici()
    .from("expert_profiles")
    .select("kind, offers_free_intro, session_minutes")
    .eq("id", uzmanId)
    .maybeSingle();
  return data as { kind: "independent" | "student"; offers_free_intro: boolean; session_minutes: number | null } | null;
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
