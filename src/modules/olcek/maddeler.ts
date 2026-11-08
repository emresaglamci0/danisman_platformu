// Olcek maddeleri TASLAKTIR; psikolojik icerigi proje sahibi onaylar.
// Grup anahtarlari (g1...g5) yalnizca kod icindir, ekranda hicbir yerde yazilmaz.
import type { Alan } from "@/lib/sabitler";

export type Grup = "g1" | "g2" | "g3" | "g4" | "g5";
export type Madde = { metin: string; grup: Grup | "psikotik" | "risk"; alanlar: Alan[] };

export const GIRIS = "Son iki haftada…";
export const YANITLAR = ["Hiç", "Bazen", "Sık sık", "Neredeyse her gün"] as const;

export const MADDELER: Madde[] = [
  { metin: "Kafamdaki endişeleri durduramadım.", grup: "g1", alanlar: ["kaygi"] },
  { metin: "Sorumluluklarımın altında tükenmiş hissettim.", grup: "g1", alanlar: ["tukenmislik"] },
  { metin: "Uykuya dalmakta ya da uykumu sürdürmekte zorlandım.", grup: "g1", alanlar: ["uyku"] },
  { metin: "Eskiden keyif aldığım şeylerden keyif alamadım.", grup: "g2", alanlar: ["duygudurum"] },
  { metin: "Yaşadığım bir kayıp ya da sarsıcı bir olay aklımdan çıkmadı.", grup: "g2", alanlar: ["yas", "travma"] },
  { metin: "Yakınlarımla (eş, partner, aile) ilişkilerim beni yıprattı.", grup: "g3", alanlar: ["iliski", "cift", "cinsel"] },
  { metin: "Aile içindeki sorunlar günlük hayatımı etkiledi.", grup: "g3", alanlar: ["aile", "ebeveynlik", "cocuk_ergen"] },
  { metin: "Yemek ya da kilom konusunda kendimi kontrol edemediğimi hissettim.", grup: "g4", alanlar: ["yeme"] },
  { metin: "Bırakmak istediğim bir alışkanlığı (alkol, madde, kumar vb.) bırakamadım.", grup: "g4", alanlar: ["bagimlilik"] },
  { metin: "İnternette, oyunlarda ya da sosyal medyada geçirdiğim süreyi kontrol edemedim.", grup: "g4", alanlar: ["bagimlilik"] },
  { metin: "Dikkatimi toplamakta ya da işlerimi düzenlemekte zorlandım.", grup: "g5", alanlar: ["norogelisim"] },
  { metin: "Okulum ya da kariyerimle ilgili ne yapacağımı bilemedim.", grup: "g5", alanlar: ["kariyer"] },
  { metin: "Kendime güvenmekte zorlandım.", grup: "g5", alanlar: ["ozguven"] },
  { metin: "Başkalarının duymadığı sesleri duydum ya da görmediği şeyleri gördüm.", grup: "psikotik", alanlar: ["psikotik"] },
  { metin: "Ölmeyi ya da kendime zarar vermeyi düşündüm.", grup: "risk", alanlar: [] },
];
