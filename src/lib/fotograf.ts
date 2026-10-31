import { supabaseSunucu } from "./supabase/sunucu";
import { FOTOGRAF_DEPOSU } from "./supabase/yonetici";

// Fotograflar ozel depoda durur; gostermek icin 1 saat gecerli imzali link uretilir.
// Veritabani kurallari yalnizca onayli uzmanlarin (ve kisinin kendi / admin icin
// tum) fotograflarina link uretilmesine izin verir.
export async function fotografLinkleri(yollar: (string | null)[]): Promise<Record<string, string>> {
  const dolu = yollar.filter((y): y is string => !!y);
  if (dolu.length === 0) return {};

  const supabase = await supabaseSunucu();
  const { data } = await supabase.storage.from(FOTOGRAF_DEPOSU).createSignedUrls(dolu, 60 * 60);

  const linkler: Record<string, string> = {};
  for (const kayit of data ?? []) {
    if (kayit.path && kayit.signedUrl && !kayit.error) linkler[kayit.path] = kayit.signedUrl;
  }
  return linkler;
}
