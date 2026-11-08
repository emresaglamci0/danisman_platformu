import { DegerlendirmePenceresi } from "@/components/DegerlendirmePenceresi";
import type { Kullanici } from "@/lib/oturum";
import { bekleyenDegerlendirme } from "@/lib/puanlar";

// Yalnizca danisan icin; bekleyen degerlendirme yoksa hicbir sey cizmez.
export async function DegerlendirmeAlani({ kullanici }: { kullanici: Kullanici | null }) {
  if (kullanici?.rol !== "client") return null;
  const bekleyen = await bekleyenDegerlendirme(kullanici.id);
  if (!bekleyen) return null;
  return <DegerlendirmePenceresi key={bekleyen.uzmanId} uzmanId={bekleyen.uzmanId} uzmanAdi={bekleyen.uzmanAdi} />;
}
