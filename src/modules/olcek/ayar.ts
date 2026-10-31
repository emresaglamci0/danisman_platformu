// Olcek modulu varsayilan olarak KAPALIDIR.
// Acmak icin .env.local dosyasinda OLCEK_MODULU_AKTIF=true yazin.
// Sitenin geri kalani bu module hic bagli degildir.
export function olcekModuluAktif() {
  return process.env.OLCEK_MODULU_AKTIF === "true";
}
