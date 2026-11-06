import { ACIL_HATLAR } from "@/lib/acil-hatlar";

// Her sayfanin ustunde gorunen ince hatirlatma. Hat listesinin tamami alttaki bantta durur. Kapatilamaz.
export function AcilDurumSeridi() {
  return (
    <p className="bg-red-50 px-4 py-1.5 text-center text-xs text-red-900">
      Bu platform acil durum hizmeti değildir. Acil durumda{" "}
      <a href="tel:112" className="font-bold underline">
        112
      </a>
      &apos;yi arayın.
    </p>
  );
}

// Her sayfanin altinda (alt bilginin ustunde) gorunen sade acil durum uyarisi. Kapatilamaz.
export function AcilDurumBandi() {
  return (
    <aside aria-label="Acil durum uyarısı" className="border-t border-red-200 bg-red-50">
      <div className="mx-auto max-w-5xl space-y-1 px-4 py-3 text-sm text-red-900">
        <p>
          <strong>Bu platform acil durum hizmeti değildir.</strong> Hayati tehlike varsa veya kendinize
          ya da bir başkasına zarar verme düşünceniz varsa hemen{" "}
          <a href="tel:112" className="font-bold underline">
            112
          </a>
          &apos;yi arayın.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {ACIL_HATLAR.map((hat) => (
            <li key={hat.numara} title={hat.aciklama}>
              <a href={`tel:${hat.numara}`} className="font-bold underline">
                {hat.numara}
              </a>{" "}
              {hat.ad}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
