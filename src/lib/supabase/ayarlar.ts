// Supabase baglanti bilgileri .env.local dosyasindan okunur; koda yazilmaz.
// Bilgiler eksikse site cokmez, ust kisimda bir uyari gosterilir.

export function supabaseAyarlari() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anahtar) return null;
  // Panelden kopyalanan adresin sonunda "/rest/v1/" gibi ekler olabilir; yalnizca
  // "https://xxxx.supabase.co" kismini kullaniyoruz.
  return { url: new URL(url).origin, anahtar };
}
