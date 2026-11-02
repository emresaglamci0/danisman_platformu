import { OnayGerekir } from "@/components/OnayGerekir";
import { Bolum, listeSinifi, YasalSayfa } from "@/components/YasalSayfa";
import { YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "Çerez Bildirimi | Danışman Buluşma" };

// Sitede yeni bir cerez veya analitik araci eklenirse bu liste guncellenmeli ve
// zorunlu olmayan cerezler icin onay penceresi eklenmelidir.
const CEREZLER = [
  {
    ad: "sb-…-auth-token",
    amac: "Giriş yaptığınızı hatırlar. Bu çerez olmadan giriş yapamazsınız.",
    sure: "Çıkış yapana kadar (en fazla 400 gün)",
  },
  {
    ad: "sb-…-auth-token-code-verifier",
    amac: "Giriş ve e-posta doğrulama sırasında bağlantının size ait olduğunu kontrol eder.",
    sure: "İşlem bitene kadar (kısa süreli)",
  },
];

export default function CerezlerSayfasi() {
  return (
    <YasalSayfa baslik="Çerez Bildirimi" guncelleme={YASAL_METIN_TARIHI}>
      <Bolum baslik="Çerez nedir?">
        <p>
          Çerez, bir sitenin tarayıcınıza kaydettiği küçük bir metin dosyasıdır. Örneğin her sayfada
          yeniden giriş yapmanızı önler.
        </p>
      </Bolum>

      <Bolum baslik="Kullandığımız çerezler">
        <p>Yalnızca sitenin çalışması için zorunlu olan çerezleri kullanıyoruz:</p>
        <ul className="space-y-3">
          {CEREZLER.map((c) => (
            <li key={c.ad} className="rounded-lg border border-slate-200 p-3">
              <p className="break-all font-mono text-xs text-slate-900">{c.ad}</p>
              <p className="mt-1">{c.amac}</p>
              <p className="mt-1 text-xs text-slate-500">Süre: {c.sure}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          &quot;…&quot; yerine sitenin veritabanı projesine ait kısa bir kod yazar. Uzun çerezler
          tarayıcıda &quot;.0&quot;, &quot;.1&quot; gibi parçalara bölünebilir.
        </p>
      </Bolum>

      <Bolum baslik="Kullanmadığımız çerezler">
        <ul className={listeSinifi}>
          <li>Analitik (ziyaretçi istatistiği) çerezleri</li>
          <li>Reklam veya yeniden hedefleme çerezleri</li>
          <li>Sosyal medya çerezleri</li>
        </ul>
      </Bolum>

      <Bolum baslik="Neden onay penceresi yok?">
        <p>
          Yalnızca zorunlu çerezler kullanıldığı için ayrıca onay istenmesine gerek olmadığı
          değerlendirilmiştir. <OnayGerekir /> İleride zorunlu olmayan bir çerez eklenirse, o çerez
          kullanılmadan önce onayınız istenecektir.
        </p>
      </Bolum>

      <Bolum baslik="Çerezleri nasıl silerim?">
        <p>
          Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri
          silerseniz oturumunuz kapanır ve giriş yapmanız gerekir.
        </p>
      </Bolum>
    </YasalSayfa>
  );
}
