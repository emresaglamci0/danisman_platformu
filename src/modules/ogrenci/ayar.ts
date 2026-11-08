// Ogrenci uzman bolumu varsayilan olarak KAPALIDIR.
// Acmak icin .env.local dosyasinda OGRENCI_MODULU_AKTIF=true yazin.
// Kapaliyken veri silinmez: mevcut ogrenci hesaplari ve sohbetleri calismaya devam eder.
export function ogrenciModuluAktif() {
  return process.env.OGRENCI_MODULU_AKTIF === "true";
}
