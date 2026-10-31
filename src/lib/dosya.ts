// Yuklenen dosyalarin turunu, dosya adina veya tarayicinin soyledigi ture guvenmeden,
// dosyanin ilk baytlarina ("imza") bakarak belirler.

export const BELGE_EN_FAZLA = 5 * 1024 * 1024; // 5 MB
export const FOTOGRAF_EN_FAZLA = 2 * 1024 * 1024; // 2 MB

type Tur = { mime: string; uzanti: string };

const IMZALAR: { tur: Tur; eslesir: (b: Uint8Array) => boolean }[] = [
  {
    tur: { mime: "application/pdf", uzanti: "pdf" },
    eslesir: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d, // %PDF-
  },
  {
    tur: { mime: "image/jpeg", uzanti: "jpg" },
    eslesir: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    tur: { mime: "image/png", uzanti: "png" },
    eslesir: (b) =>
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((deger, i) => b[i] === deger),
  },
  {
    tur: { mime: "image/webp", uzanti: "webp" },
    eslesir: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
];

export function dosyaTuruBul(baytlar: Uint8Array, izinliler: string[]): Tur | null {
  const bulunan = IMZALAR.find((imza) => imza.eslesir(baytlar));
  return bulunan && izinliler.includes(bulunan.tur.mime) ? bulunan.tur : null;
}

// Formdan gelen alanin gercekten bos olmayan bir dosya olup olmadigini kontrol eder
export function formDosyasi(deger: FormDataEntryValue | null): File | null {
  return deger instanceof File && deger.size > 0 ? deger : null;
}
