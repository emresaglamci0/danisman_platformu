import { NextResponse, type NextRequest } from "next/server";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

// Kullanici e-postadaki dogrulama veya sifre sifirlama baglantisina tiklayinca buraya gelir.
// Baglantidaki tek kullanimlik kod, oturuma cevrilir.
export async function GET(request: NextRequest) {
  const kod = request.nextUrl.searchParams.get("code");
  // Adres disaridan degistirilebilir: baska siteye yonlendirme olmasin diye yalnizca bu deger kabul edilir.
  const sifreYenileme = request.nextUrl.searchParams.get("sonra") === "sifre-yenile";

  if (kod) {
    const supabase = await supabaseSunucu();
    const { error } = await supabase.auth.exchangeCodeForSession(kod);
    if (!error) return NextResponse.redirect(new URL(sifreYenileme ? "/sifre-yenile" : "/panel", request.url));
  }

  return NextResponse.redirect(new URL(sifreYenileme ? "/sifremi-unuttum?gecersiz=1" : "/giris", request.url));
}
