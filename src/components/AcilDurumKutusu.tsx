// Sohbet ekraninda her zaman gorunen acil durum kutusu. Kapatilamaz.
// UYARI: Numaralar yayindan once resmi kaynaklardan yeniden dogrulanmalidir.
// Turkiye'de intihar icin ayri bir ulusal hat bilinmiyor; risk aninda 112 aranmalidir.
const HATLAR = [
  { numara: "112", ad: "Acil Çağrı Merkezi", aciklama: "Hayati tehlike, intihar riski, her türlü acil durum" },
  { numara: "183", ad: "Sosyal Destek Hattı", aciklama: "Aile ve Sosyal Hizmetler Bakanlığı, şiddet ve kriz durumları" },
  { numara: "114", ad: "Ulusal Zehir Danışma Merkezi", aciklama: "İlaç veya madde zehirlenmesi şüphesi" },
];

export function AcilDurumKutusu() {
  return (
    <aside
      aria-label="Acil durum bilgisi"
      className="sticky top-0 z-10 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 shadow-sm"
    >
      <p className="font-semibold">
        Kendinize veya bir başkasına zarar verme düşünceniz varsa ya da acil bir durumdaysanız
        hemen <a href="tel:112" className="underline">112</a>&apos;yi arayın.
      </p>
      <p className="mt-1">
        Bu mesajlaşma acil durum hizmeti değildir; uzmanınız mesajlara hemen yanıt veremeyebilir.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {HATLAR.map((hat) => (
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
