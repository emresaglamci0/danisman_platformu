// Sohbet ekranindaki acil durum kutusu ve her sayfadaki acil durum bandi bu listeyi kullanir.
// UYARI: Numaralar yayindan once resmi kaynaklardan yeniden dogrulanmalidir.
// Turkiye'de intihar icin ayri bir ulusal hat bilinmiyor; risk aninda 112 aranmalidir.
export const ACIL_HATLAR = [
  { numara: "112", ad: "Acil Çağrı Merkezi", aciklama: "Hayati tehlike, intihar riski, her türlü acil durum" },
  { numara: "183", ad: "Sosyal Destek Hattı", aciklama: "Aile ve Sosyal Hizmetler Bakanlığı, şiddet ve kriz durumları" },
  { numara: "114", ad: "Ulusal Zehir Danışma Merkezi", aciklama: "İlaç veya madde zehirlenmesi şüphesi" },
] as const;
