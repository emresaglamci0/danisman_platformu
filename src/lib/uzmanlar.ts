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
  fotoLink: string | null;
};

const ALANLAR_SORGU = "id, kind, display_name, title, department, specialties, bio, photo_path";

async function fotograflariEkle(uzmanlar: Omit<Uzman, "fotoLink">[]): Promise<Uzman[]> {
  const linkler = await fotografLinkleri(uzmanlar.map((u) => u.photo_path));
  return uzmanlar.map((u) => ({ ...u, fotoLink: u.photo_path ? (linkler[u.photo_path] ?? null) : null }));
}

// Yalnizca onayli uzmanlar doner; bu kurali veritabani da (RLS) ayrica uygular.
export async function onayliUzmanlar(tur?: Uzman["kind"]): Promise<Uzman[]> {
  if (!supabaseAyarlari()) return [];
  const supabase = await supabaseSunucu();
  let sorgu = supabase
    .from("expert_profiles")
    .select(ALANLAR_SORGU)
    .eq("status", "approved")
    .order("display_name");
  if (tur) sorgu = sorgu.eq("kind", tur);
  const { data } = await sorgu;
  return fotograflariEkle(data ?? []);
}

export async function uzmanGetir(id: string): Promise<Uzman | null> {
  if (!supabaseAyarlari()) return null;
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("expert_profiles")
    .select(ALANLAR_SORGU)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!data) return null;
  const [uzman] = await fotograflariEkle([data]);
  return uzman;
}

export function uzmanUnvani(uzman: Pick<Uzman, "kind" | "title" | "department">) {
  if (uzman.kind === "student" && uzman.department) {
    return `Stajyer · ${BOLUMLER[uzman.department]} son sınıf`;
  }
  return uzman.title ? UNVANLAR[uzman.title] : "";
}
