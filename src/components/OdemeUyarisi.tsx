import { OnayGerekir } from "@/components/OnayGerekir";

// Bagimsiz uzman sohbetlerinde gorusme baglantisinin yaninda gorunur. Ogrenci uzmanlar ucret almadigi
// icin onlarda gosterilmemelidir. Site ici odeme acilinca "yakinda" cumlesi kaldirilmalidir.
export function OdemeUyarisi() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
      Ödemeleri site içinden yapmanız güvenliğiniz açısından önemlidir. Site dışında yapılan ödemeler
      sitemizi ilgilendirmemektedir. <OnayGerekir /> Site içi ödeme sistemi yakında açılacaktır.
    </p>
  );
}
