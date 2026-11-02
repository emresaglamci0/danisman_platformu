"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { BELGE_EN_FAZLA, FOTOGRAF_EN_FAZLA, dosyaTuruBul, formDosyasi } from "@/lib/dosya";
import type { FormDurumu } from "@/lib/hatalar";
import { mevcutKullanici } from "@/lib/oturum";
import { BELGE_TURLERI, listedeMi } from "@/lib/sabitler";
import { BELGE_DEPOSU, FOTOGRAF_DEPOSU, supabaseYonetici } from "@/lib/supabase/yonetici";

// Her yuklemeden once veritabanindan yukleme hakki istenir (saatte en fazla 10, 0008).
// Ucuz kontrollerden (boyut, tur) SONRA, pahali islerden (fotograf isleme, yukleme) ONCE cagrilir.
async function yuklemeHakkiAl(kullaniciId: string, tur: "belge" | "fotograf"): Promise<string | null> {
  const { error } = await supabaseYonetici().rpc("yukleme_hakki_kullan", { p_kullanici: kullaniciId, p_tur: tur });
  if (!error) return null;
  if (error.message.includes("HIZ_SINIRI")) {
    return "Son bir saatte çok fazla dosya yüklediniz. Lütfen biraz sonra tekrar deneyin.";
  }
  return "Dosya yüklenemedi. Lütfen tekrar deneyin.";
}

async function uzmanKullanici() {
  const kullanici = await mevcutKullanici();
  if (!kullanici || (kullanici.rol !== "expert" && kullanici.rol !== "student_expert")) return null;
  return kullanici;
}

// ---------------------------------------------------------------------
// Belge yukleme
// ---------------------------------------------------------------------
export async function belgeYukle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await uzmanKullanici();
  if (!kullanici) return { hata: "Bu işlem yalnızca uzman hesapları içindir." };

  const belgeTuru = form.get("belgeTuru");
  const dosya = formDosyasi(form.get("dosya"));

  if (!listedeMi(BELGE_TURLERI, belgeTuru)) return { hata: "Lütfen belge türünü seçin." };
  if (!dosya) return { hata: "Lütfen bir dosya seçin." };
  if (dosya.size > BELGE_EN_FAZLA) return { hata: "Dosya en fazla 5 MB olabilir." };

  const baytlar = new Uint8Array(await dosya.arrayBuffer());
  const tur = dosyaTuruBul(baytlar, ["application/pdf", "image/jpeg", "image/png"]);
  if (!tur) return { hata: "Yalnızca PDF, JPG veya PNG dosyası yükleyebilirsiniz." };

  const yonetici = supabaseYonetici();
  const { data: profil } = await yonetici
    .from("expert_profiles")
    .select("kind, status, verified_until")
    .eq("id", kullanici.id)
    .single();
  if (!profil) return { hata: "Uzman profiliniz bulunamadı." };

  if (BELGE_TURLERI[belgeTuru].tur !== profil.kind) {
    return { hata: "Bu belge türü hesap türünüz için geçerli değil." };
  }
  const bugun = new Date().toISOString().slice(0, 10);
  const onayGecerli =
    profil.status === "approved" && (!profil.verified_until || profil.verified_until >= bugun);
  if (onayGecerli) return { hata: "Hesabınız onaylı; şu an yeni belge yüklemenize gerek yok." };

  const hakHatasi = await yuklemeHakkiAl(kullanici.id, "belge");
  if (hakHatasi) return { hata: hakHatasi };

  // Dosya adi rastgele: kullanicinin verdigi dosya adi hic kullanilmaz
  const yol = `${kullanici.id}/${belgeTuru}-${randomUUID()}.${tur.uzanti}`;
  const { error: yuklemeHatasi } = await yonetici.storage
    .from(BELGE_DEPOSU)
    .upload(yol, baytlar, { contentType: tur.mime });
  if (yuklemeHatasi) return { hata: "Dosya yüklenemedi. Lütfen tekrar deneyin." };

  // Ayni turde eski bir belge varsa yenisi onun yerine gecer, eski dosya silinir
  const { data: eski } = await yonetici
    .from("expert_documents")
    .select("storage_path")
    .eq("expert_id", kullanici.id)
    .eq("doc_type", belgeTuru)
    .maybeSingle();

  const { error: kayitHatasi } = await yonetici.from("expert_documents").upsert(
    {
      expert_id: kullanici.id,
      doc_type: belgeTuru,
      storage_path: yol,
      mime_type: tur.mime,
      size_bytes: dosya.size,
      created_at: new Date().toISOString(),
    },
    { onConflict: "expert_id,doc_type" },
  );
  if (kayitHatasi) {
    await yonetici.storage.from(BELGE_DEPOSU).remove([yol]);
    return { hata: "Belge kaydedilemedi. Lütfen tekrar deneyin." };
  }
  if (eski?.storage_path) await yonetici.storage.from(BELGE_DEPOSU).remove([eski.storage_path]);

  // Reddedilmis veya suresi dolmus hesap yeni belgeyle tekrar incelemeye girer
  if (profil.status !== "pending") {
    await yonetici
      .from("expert_profiles")
      .update({ status: "pending", review_note: null })
      .eq("id", kullanici.id);
  }

  revalidatePath("/panel");
  return { basari: "Belgeniz yüklendi. Yönetici incelemesinden sonra size sonuç gösterilecek." };
}

// ---------------------------------------------------------------------
// Profil fotografi
// ---------------------------------------------------------------------
export async function fotografYukle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullanici = await uzmanKullanici();
  if (!kullanici) return { hata: "Bu işlem yalnızca uzman hesapları içindir." };

  const dosya = formDosyasi(form.get("fotograf"));
  if (!dosya) return { hata: "Lütfen bir fotoğraf seçin." };
  if (dosya.size > FOTOGRAF_EN_FAZLA) return { hata: "Fotoğraf en fazla 2 MB olabilir." };

  const baytlar = new Uint8Array(await dosya.arrayBuffer());
  if (!dosyaTuruBul(baytlar, ["image/jpeg", "image/png", "image/webp"])) {
    return { hata: "Yalnızca JPG, PNG veya WebP fotoğraf yükleyebilirsiniz." };
  }

  const hakHatasi = await yuklemeHakkiAl(kullanici.id, "fotograf");
  if (hakHatasi) return { hata: hakHatasi };

  // Fotografi yeniden olustur: yon bilgisini uygula, 400x400'e kucult, WebP'ye cevir.
  // sharp, yeni dosyaya konum (GPS), cihaz modeli gibi EXIF bilgilerini KOPYALAMAZ.
  let islenmis: Buffer;
  try {
    islenmis = await sharp(baytlar, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { hata: "Fotoğraf okunamadı. Başka bir dosya deneyin." };
  }

  const yonetici = supabaseYonetici();
  const yol = `${kullanici.id}/${randomUUID()}.webp`;
  const { error } = await yonetici.storage
    .from(FOTOGRAF_DEPOSU)
    .upload(yol, islenmis, { contentType: "image/webp" });
  if (error) return { hata: "Fotoğraf yüklenemedi. Lütfen tekrar deneyin." };

  const sonuc = await fotografYolunuDegistir(kullanici.id, yol);
  if (!sonuc.tamam) {
    await yonetici.storage.from(FOTOGRAF_DEPOSU).remove([yol]);
    return { hata: "Fotoğraf kaydedilemedi. Lütfen tekrar deneyin." };
  }
  if (sonuc.eskiYol) await yonetici.storage.from(FOTOGRAF_DEPOSU).remove([sonuc.eskiYol]);

  revalidatePath("/panel");
  return { basari: "Fotoğrafınız güncellendi." };
}

export async function fotografSil() {
  const kullanici = await uzmanKullanici();
  if (!kullanici) return;

  const sonuc = await fotografYolunuDegistir(kullanici.id, null);
  if (sonuc.tamam && sonuc.eskiYol) {
    await supabaseYonetici().storage.from(FOTOGRAF_DEPOSU).remove([sonuc.eskiYol]);
  }

  revalidatePath("/panel");
}

// Profildeki fotograf yolunu degistirir; basariliysa eski yolu da dondurur (silmek icin)
async function fotografYolunuDegistir(uzmanId: string, yeniYol: string | null) {
  const yonetici = supabaseYonetici();
  const { data } = await yonetici.from("expert_profiles").select("photo_path").eq("id", uzmanId).single();
  const { error } = await yonetici.from("expert_profiles").update({ photo_path: yeniYol }).eq("id", uzmanId);
  return { tamam: !error, eskiYol: (data?.photo_path as string | null) ?? null };
}
