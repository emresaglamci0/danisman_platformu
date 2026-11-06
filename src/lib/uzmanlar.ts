import { fotografLinkleri } from "./fotograf";
import { supabaseAyarlari } from "./supabase/ayarlar";
import { supabaseSunucu } from "./supabase/sunucu";
import { BOLUMLER, UNVANLAR, type Alan, type Bolum, type Unvan } from "./sabitler";

export type Uzman = {
  id: string;
  kind: "independent" | "student";
  display_name: string;
  title: Unvan | null;
  department: Bolum | null;
  specialties: Alan[];
  bio: string | null;
  photo_path: string | null;
  offers_free_intro: boolean;
  fotoLink: string | null;
};

const ALANLAR_SORGU = "id, kind, display_name, title, department, specialties, bio, photo_path, offers_free_intro";

async function fotograflariEkle(uzmanlar: Omit<Uzman, "fotoLink">[]): Promise<Uzman[]> {
  const linkler = await fotografLinkleri(uzmanlar.map((u) => u.photo_path));
  return uzmanlar.map((u) => ({ ...u, fotoLink: u.photo_path ? (linkler[u.photo_path] ?? null) : null }));
}

// Herkese acik bilgiler "uzman_vitrini" gorunumunden okunur (0009). Gorunum yalnizca onayli
// uzmanlari ve yalnizca gerekli sutunlari icerir; asil tabloyu yalnizca uzmanin kendisi ve admin gorur.
export async function onayliUzmanlar(tur?: Uzman["kind"]): Promise<Uzman[]> {
  if (!supabaseAyarlari()) return [];
  const supabase = await supabaseSunucu();
  let sorgu = supabase.from("uzman_vitrini").select(ALANLAR_SORGU).order("display_name");
  if (tur) sorgu = sorgu.eq("kind", tur);
  const { data } = await sorgu;
  return fotograflariEkle(data ?? []);
}

export async function onGorusmeYapanUzmanlar(): Promise<Uzman[]> {
  if (!supabaseAyarlari()) return [];
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("uzman_vitrini")
    .select(ALANLAR_SORGU)
    .eq("offers_free_intro", true)
    .order("display_name");
  return fotograflariEkle(data ?? []);
}

export async function uzmanGetir(id: string): Promise<Uzman | null> {
  if (!supabaseAyarlari()) return null;
  const supabase = await supabaseSunucu();
  const { data } = await supabase.from("uzman_vitrini").select(ALANLAR_SORGU).eq("id", id).maybeSingle();
  if (!data) return null;
  const [uzman] = await fotograflariEkle([data]);
  return uzman;
}

// Verilen uzmanlarin gorunen adlarini dondurur. Once herkese acik vitrine bakar; orada olmayan
// (onayi kalkmis) uzmanlar icin asil tabloya bakar: bunu yalnizca uzmanin kendisi ve admin gorebilir.
export async function uzmanAdlari(idler: string[]): Promise<Map<string, string>> {
  const adlar = new Map<string, string>();
  const tekil = [...new Set(idler)];
  if (tekil.length === 0) return adlar;

  const supabase = await supabaseSunucu();
  const { data: vitrin } = await supabase.from("uzman_vitrini").select("id, display_name").in("id", tekil);
  for (const u of vitrin ?? []) adlar.set(u.id, u.display_name);

  const eksik = tekil.filter((id) => !adlar.has(id));
  if (eksik.length > 0) {
    const { data: ozel } = await supabase.from("expert_profiles").select("id, display_name").in("id", eksik);
    for (const u of ozel ?? []) adlar.set(u.id, u.display_name);
  }
  return adlar;
}

export function uzmanUnvani(uzman: Pick<Uzman, "kind" | "title" | "department">) {
  if (uzman.kind === "student" && uzman.department) {
    return `Stajyer · ${BOLUMLER[uzman.department]} son sınıf`;
  }
  return uzman.title ? UNVANLAR[uzman.title] : "";
}
