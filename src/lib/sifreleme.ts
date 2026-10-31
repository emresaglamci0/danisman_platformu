import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { supabaseYonetici } from "./supabase/yonetici";

// Mesaj sifreleme (plandaki B secenegi):
// - Ana anahtar Supabase Vault'ta durur, yalnizca sunucu okuyabilir.
// - Her konusmanin kendi anahtari vardir; bu anahtar ana anahtarla sifrelenip veritabaninda saklanir.
// - Mesajlar konusma anahtariyla AES-256-GCM (Node.js'in yerlesik, OpenSSL tabanli kutuphanesi) ile sifrelenir.
// Kendi algoritmamizi yazmiyoruz; yalnizca standart AES-256-GCM'i kullaniyoruz.

const SURUM = "v1";
let anaAnahtarOnbellek: Buffer | null = null;

async function anaAnahtar(): Promise<Buffer> {
  if (anaAnahtarOnbellek) return anaAnahtarOnbellek;
  const { data, error } = await supabaseYonetici().rpc("mesaj_ana_anahtari");
  if (error || typeof data !== "string") {
    throw new Error("Mesaj şifreleme anahtarı alınamadı. 0003 SQL dosyası çalıştırıldı mı?");
  }
  const anahtar = Buffer.from(data, "base64");
  if (anahtar.length !== 32) throw new Error("Mesaj şifreleme anahtarı geçersiz.");
  anaAnahtarOnbellek = anahtar;
  return anahtar;
}

// "ek" (konusma kimligi) sifreli metne baglanir: baska bir konusmaya tasinan mesaj cozulemez.
function kilitle(anahtar: Buffer, acikMetin: Buffer, ek: string): string {
  const iv = randomBytes(12);
  const sifreleyici = createCipheriv("aes-256-gcm", anahtar, iv);
  sifreleyici.setAAD(Buffer.from(ek, "utf8"));
  const sifreli = Buffer.concat([sifreleyici.update(acikMetin), sifreleyici.final()]);
  const etiket = sifreleyici.getAuthTag();
  return [SURUM, iv, etiket, sifreli].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

function ac(anahtar: Buffer, paket: string, ek: string): Buffer {
  const [surum, iv, etiket, sifreli] = paket.split(".");
  if (surum !== SURUM || !iv || !etiket || sifreli === undefined) throw new Error("Bilinmeyen şifreli veri biçimi");
  const cozucu = createDecipheriv("aes-256-gcm", anahtar, Buffer.from(iv, "base64url"));
  cozucu.setAAD(Buffer.from(ek, "utf8"));
  cozucu.setAuthTag(Buffer.from(etiket, "base64url"));
  return Buffer.concat([cozucu.update(Buffer.from(sifreli, "base64url")), cozucu.final()]);
}

// Yeni bir konusma icin rastgele anahtar uretir, ana anahtarla sifreli halini dondurur
export async function yeniKonusmaAnahtari(basvuruId: string): Promise<string> {
  return kilitle(await anaAnahtar(), randomBytes(32), `konusma:${basvuruId}`);
}

async function konusmaAnahtari(sarilmisAnahtar: string, basvuruId: string) {
  return ac(await anaAnahtar(), sarilmisAnahtar, `konusma:${basvuruId}`);
}

export type KonusmaAnahtarBilgisi = { id: string; application_id: string; wrapped_key: string };

export async function mesajSifrele(konusma: KonusmaAnahtarBilgisi, metin: string) {
  const anahtar = await konusmaAnahtari(konusma.wrapped_key, konusma.application_id);
  return kilitle(anahtar, Buffer.from(metin, "utf8"), `mesaj:${konusma.id}`);
}

export async function mesajlariCoz(konusma: KonusmaAnahtarBilgisi, paketler: string[]) {
  const anahtar = await konusmaAnahtari(konusma.wrapped_key, konusma.application_id);
  return paketler.map((paket) => {
    try {
      return ac(anahtar, paket, `mesaj:${konusma.id}`).toString("utf8");
    } catch {
      return null; // Bozuk veya baska konusmaya ait veri: icerik gosterilmez
    }
  });
}
