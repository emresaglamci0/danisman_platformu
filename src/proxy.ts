import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";

// Her sayfa isteginden once calisir:
// 1) Icerik Guvenlik Politikasi (CSP) ekler: sayfada yalnizca bizim betiklerimiz calisabilir.
// 2) Suresi dolmak uzere olan oturumu yeniler.
// 3) Giris yapmamis kisiyi /panel, /admin ve /mesajlar sayfalarindan giris sayfasina yonlendirir.

// Her istekte yeni, tahmin edilemez bir "nonce" (tek kullanimlik kod) uretilir. Next.js kendi
// betiklerine bu kodu otomatik ekler; kodu tasimayan (disaridan sizdirilmis) betikler calismaz.
function guvenlikPolitikasi(nonce: string) {
  const gelistirme = process.env.NODE_ENV === "development";
  const supabase = supabaseAyarlari()?.url ?? "";
  const httpsSite = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

  return [
    "default-src 'self'",
    // Gelistirme modunda React hata ayiklamasi icin 'unsafe-eval' gerekir; yayinda kullanilmaz
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${gelistirme ? " 'unsafe-eval'" : ""}`,
    // Stiller: Tailwind dosyasi + bilesenlerdeki boyut stilleri. Stil, betik kadar tehlikeli degildir.
    "style-src 'self' 'unsafe-inline'",
    // Resimler: kendi sitemiz, QR kod (data:) ve Supabase'deki profil fotograflari
    `img-src 'self' data: blob: ${supabase}`.trim(),
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Yalnizca site HTTPS uzerinden yayindaysa: tum kaynaklari HTTPS'e zorla
    ...(httpsSite ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const politika = guvenlikPolitikasi(nonce);

  // Next.js'in nonce'u gorebilmesi icin politika istek basliklarina da eklenir
  const devamEt = () => {
    const basliklar = new Headers(request.headers);
    basliklar.set("x-nonce", nonce);
    basliklar.set("Content-Security-Policy", politika);
    const yanit = NextResponse.next({ request: { headers: basliklar } });
    yanit.headers.set("Content-Security-Policy", politika);
    return yanit;
  };

  const ayarlar = supabaseAyarlari();
  if (!ayarlar) return devamEt();

  let yanit = devamEt();

  const supabase = createServerClient(ayarlar.url, ayarlar.anahtar, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(yazilacaklar, basliklar) {
        yazilacaklar.forEach(({ name, value }) => request.cookies.set(name, value));
        yanit = devamEt();
        yazilacaklar.forEach(({ name, value, options }) => yanit.cookies.set(name, value, options));
        Object.entries(basliklar).forEach(([anahtar, deger]) => yanit.headers.set(anahtar, deger));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  const korunan = ["/panel", "/admin", "/mesajlar"].some((yol) => request.nextUrl.pathname.startsWith(yol));
  if (!data?.claims && korunan) {
    const adres = request.nextUrl.clone();
    adres.pathname = "/giris";
    adres.search = "";
    return NextResponse.redirect(adres);
  }

  return yanit;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
