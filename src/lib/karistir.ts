// Puansiz uzmanlar ve ogrenci uzmanlar icin liste karistirilir (Fisher-Yates); siralama kurali src/lib/siralama.ts.
// Girdi degistirilmez; yeni dizi doner. Bu dosya runtime importu icermez.
export function karistir<T>(liste: readonly T[], rastgele: () => number = Math.random): T[] {
  const sonuc = [...liste];
  for (let i = sonuc.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [sonuc[i], sonuc[j]] = [sonuc[j], sonuc[i]];
  }
  return sonuc;
}
