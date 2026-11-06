import { NextResponse } from "next/server";
import { bildirimSayilari } from "@/lib/bildirimler";
import { mevcutKullanici } from "@/lib/oturum";

// Ust menudeki sayaclar buradan okunur. Yanit kullaniciya ozeldir, onbellege alinmaz.
export async function GET() {
  const kullanici = await mevcutKullanici();
  const sayilar = kullanici ? await bildirimSayilari(kullanici) : { mesaj: 0, panel: 0 };
  return NextResponse.json(sayilar, { headers: { "Cache-Control": "no-store" } });
}
