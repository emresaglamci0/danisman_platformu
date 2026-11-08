import { UzmanKarti } from "@/components/UzmanKarti";
import { mevcutKullanici } from "@/lib/oturum";
import { bekleyenDegerlendirme } from "@/lib/puanlar";
import { onayliUzmanlar } from "@/lib/uzmanlar";
import { olcekModuluAktif } from "./ayar";
import { OlcekPenceresi } from "./OlcekPenceresi";

// Sitenin olcek modulune actigi TEK kapi. Modul kapaliysa hicbir sey gostermez.
export async function OlcekAlani() {
  if (!olcekModuluAktif()) return null;
  // Yalnizca giris yapmamis ziyaretci ve danisan gorur.
  const kullanici = await mevcutKullanici();
  if (kullanici && kullanici.rol !== "client") return null;

  // shortcut: tüm onaylı uzmanlar ana sayfaya gömülür; uzman sayısı yüzleri aşınca küçük sayfalı istemci sorgusu düşünülmeli.
  const liste = await onayliUzmanlar();
  const uzmanlar = liste.map(({ id, kind, display_name, specialties }) => ({ id, kind, display_name, specialties }));
  const kartlar = Object.fromEntries(liste.map((x) => [x.id, <UzmanKarti key={x.id} uzman={x} prefetch={false} />]));
  // Bekleyen uzman degerlendirmesi penceresi varken olcek daveti kendiliginden acilmaz.
  const bekleyen = kullanici ? await bekleyenDegerlendirme(kullanici.id) : null;
  return <OlcekPenceresi uzmanlar={uzmanlar} kartlar={kartlar} davetiBastir={bekleyen !== null} />;
}
