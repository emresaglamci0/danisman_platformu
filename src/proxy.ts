import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";

// Her sayfa isteginden once calisir:
// 1) Suresi dolmak uzere olan oturumu yeniler.
// 2) Giris yapmamis kisiyi /panel sayfasindan giris sayfasina yonlendirir.
export async function proxy(request: NextRequest) {
  const ayarlar = supabaseAyarlari();
  if (!ayarlar) return NextResponse.next();

  let yanit = NextResponse.next({ request });

  const supabase = createServerClient(ayarlar.url, ayarlar.anahtar, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(yazilacaklar, basliklar) {
        yazilacaklar.forEach(({ name, value }) => request.cookies.set(name, value));
        yanit = NextResponse.next({ request });
        yazilacaklar.forEach(({ name, value, options }) => yanit.cookies.set(name, value, options));
        Object.entries(basliklar).forEach(([anahtar, deger]) => yanit.headers.set(anahtar, deger));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && request.nextUrl.pathname.startsWith("/panel")) {
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
