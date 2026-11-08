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
  offers_online: boolean;
  offers_in_person: boolean;
  city: string | null;
  district: string | null;
  session_minutes: number | null;
  puan_ortalama: number | null;
  puan_sayisi: number;
  fotoLink: string | null;
};

const ALANLAR_SORGU =
  "id, kind, display_name, title, department, specialties, bio, photo_path, offers_free_intro, offers_online, offers_in_person, city, district, session_minutes, puan_ortalama, puan_sayisi";

// PostgREST numeric degeri metin dondurebilir; puan_ortalama sayiya cevrilir.
type HamUzman = Omit<Uzman, "fotoLink" | "puan_ortalama"> & { puan_ortalama: number | string | null };

async function fotograflariEkle(uzmanlar: HamUzman[]): Promise<Uzman[]> {
  const linkler = await fotografLinkleri(uzmanlar.map((u) => u.photo_path));
  return uzmanlar.map((u) => ({
    ...u,
    puan_ortalama: u.puan_ortalama === null ? null : Number(u.puan_ortalama),
    fotoLink: u.photo_path ? (linkler[u.photo_path] ?? null) : null,
  }));
}

// Herkese acik bilgiler "uzman_vitrini" gorunumunden okunur (0009). Gorunum yalnizca onayli
// uzmanlari ve yalnizca gerekli sutunlari icerir; asil tabloyu yalnizca uzmanin kendisi ve admin gorur.
export async function onayliUzmanlar(
  filtre: { tur?: Uzman["kind"]; alan?: Alan; ara?: string; unvan?: Unvan; bolum?: Bolum } = {},
): Promise<Uzman[]> {
  if (!supabaseAyarlari()) return [];
  const supabase = await supabaseSunucu();
  let sorgu = supabase.from("uzman_vitrini").select(ALANLAR_SORGU).order("display_name");
  if (filtre.tur) sorgu = sorgu.eq("kind", filtre.tur);
  if (filtre.unvan) sorgu = sorgu.eq("title", filtre.unvan);
  if (filtre.bolum) sorgu = sorgu.eq("department", filtre.bolum);
  if (filtre.alan) sorgu = sorgu.contains("specialties", [filtre.alan]);
  // Joker karakterler atilir; kullanici metni yalnizca "icinde gecen" arama olarak calisir.
  // shortcut: ilike Turkce I/i farkini bilmez ("ipek" -> "İpek" bulunmayabilir), sorun olursa arama sutunu eklenmeli.
  const ara = filtre.ara?.replace(/[%_*\\]/g, "");
  if (ara) sorgu = sorgu.ilike("display_name", `%${ara}%`);
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
    return `Stajyer · ${BOLUMLER[uzman.department]}`;
  }
  return uzman.title ? UNVANLAR[uzman.title] : "";
}
