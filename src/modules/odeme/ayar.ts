// Demo odeme modulu varsayilan olarak KAPALIDIR.
// Acmak icin .env.local dosyasinda ODEME_MODULU_AKTIF=true yazin.
// Kapaliyken plan ve onay calisir, odeme adimi ve komisyon gorunmez.
export function odemeModuluAktif() {
  return process.env.ODEME_MODULU_AKTIF === "true";
}
