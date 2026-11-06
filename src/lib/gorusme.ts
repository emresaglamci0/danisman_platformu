// Uzmanin paylasabilecegi gorusme servisleri. Sahte sitelere yonlendirmeyi zorlastirmak icin
// yalnizca bu adreslere izin verilir. Yeni bir servis eklenecekse buraya yazilir.
const IZINLI_ALAN_ADLARI = ["meet.google.com", "zoom.us", "teams.microsoft.com", "teams.live.com"];

export const GORUSME_BAGLANTISI_EN_FAZLA = 300; // veritabanindaki sinirla ayni

export function gorusmeBaglantisiGecerli(adres: string) {
  if (adres.length > GORUSME_BAGLANTISI_EN_FAZLA) return false;
  try {
    const url = new URL(adres);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    // "us02web.zoom.us" gibi alt adresler gecerli; "zoom.us.kotu.com" gecerli degil
    return IZINLI_ALAN_ADLARI.some((alan) => url.hostname === alan || url.hostname.endsWith(`.${alan}`));
  } catch {
    return false;
  }
}
