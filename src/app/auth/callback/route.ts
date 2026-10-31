import { NextResponse, type NextRequest } from "next/server";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

// Kullanici e-postadaki dogrulama baglantisina tiklayinca buraya gelir.
// Baglantidaki tek kullanimlik kod, oturuma cevrilir.
export async function GET(request: NextRequest) {
  const kod = request.nextUrl.searchParams.get("code");

  if (kod) {
    const supabase = await supabaseSunucu();
    const { error } = await supabase.auth.exchangeCodeForSession(kod);
    if (!error) return NextResponse.redirect(new URL("/panel", request.url));
  }

  return NextResponse.redirect(new URL("/giris", request.url));
}
