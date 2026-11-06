import { ACIL_HATLAR } from "@/lib/acil-hatlar";

// Sohbet ekraninda her zaman gorunen acil durum kutusu. Kapatilamaz.
export function AcilDurumKutusu() {
  return (
    <aside
      aria-label="Acil durum bilgisi"
      className="sticky top-0 z-10 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
    >
      <p className="font-medium">
        Kendinize veya bir başkasına zarar verme düşünceniz varsa ya da acil bir durumdaysanız
        hemen <a href="tel:112" className="underline">112</a>&apos;yi arayın.
      </p>
      <p className="mt-1">
        Bu mesajlaşma acil durum hizmeti değildir; uzmanınız mesajlara hemen yanıt veremeyebilir.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {ACIL_HATLAR.map((hat) => (
          <li key={hat.numara} title={hat.aciklama}>
            <a href={`tel:${hat.numara}`} className="font-bold underline">
              {hat.numara}
            </a>{" "}
            {hat.ad}
          </li>
        ))}
      </ul>
    </aside>
  );
}
