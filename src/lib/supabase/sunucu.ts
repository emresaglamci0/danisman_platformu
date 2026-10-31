import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAyarlari } from "./ayarlar";

// Sunucu tarafinda (sayfalar ve form islemleri) kullanilan Supabase istemcisi.
// Her istekte yeniden olusturulur; oturum bilgisi cerezlerden okunur.
export async function supabaseSunucu() {
  const ayarlar = supabaseAyarlari();
  if (!ayarlar) {
    throw new Error("Supabase ayarları eksik. .env.local dosyasını doldurun.");
  }
  const cerezler = await cookies();

  return createServerClient(ayarlar.url, ayarlar.anahtar, {
    cookies: {
      getAll() {
        return cerezler.getAll();
      },
      setAll(yazilacaklar) {
        try {
          yazilacaklar.forEach(({ name, value, options }) => cerezler.set(name, value, options));
        } catch {
          // Sayfa cizilirken cerez yazilamaz; oturum yenilemesini proxy.ts yapar.
        }
      },
    },
  });
}
