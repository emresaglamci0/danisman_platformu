import { OnayGerekir } from "@/components/OnayGerekir";
import { odemeModuluAktif } from "@/modules/odeme/ayar";

// Bagimsiz uzman sohbetlerinde gorunur. Ogrenci uzmanlar ucret almadigi icin onlarda gosterilmemelidir.
export function OdemeUyarisi() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
      Ödemeleri site içinden yapmanız güvenliğiniz açısından önemlidir. Site dışında yapılan ödemeler
      sitemizi ilgilendirmemektedir. <OnayGerekir />
      {!odemeModuluAktif() && " Site içi ödeme sistemi yakında açılacaktır."}
    </p>
  );
}
