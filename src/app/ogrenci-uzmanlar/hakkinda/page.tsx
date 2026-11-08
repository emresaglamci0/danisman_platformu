import Link from "next/link";
import { notFound } from "next/navigation";
import { ogrenciModuluAktif } from "@/modules/ogrenci/ayar";
import { OnayGerekir } from "@/components/OnayGerekir";
import { Bolum, listeSinifi, YasalSayfa } from "@/components/YasalSayfa";
import { YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "Öğrenci Uzmanlar Hakkında | Danışman Buluşma" };

// Staj, supervizyon ve kurum onayi henuz dogrulanmadi. Bunlar netlesmeden kesin bilgi gibi yazilmamali.
export default function OgrenciUzmanlarSayfasi() {
  if (!ogrenciModuluAktif()) notFound();

  return (
    <YasalSayfa baslik="Öğrenci Uzmanlar Hakkında" guncelleme={YASAL_METIN_TARIHI}>
      <Bolum baslik="Öğrenci uzman kimdir?">
        <p>
          Öğrenci uzmanlar, Rehberlik ve Psikolojik Danışmanlık (PDR) bölümünün
          <strong> 4. sınıf öğrencileri</strong> veya <strong>Klinik Psikoloji yüksek lisans öğrencileridir</strong>. Lisanslı bir psikolog veya psikolojik
          danışman <strong>değildirler</strong>. Profillerinde &quot;Stajyer · Ücretsiz&quot;
          etiketi görünür. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="Görüşmeler ücretsizdir">
        <ul className={listeSinifi}>
          <li>Öğrenci uzmanlarla yapılan görüşmeler tamamen ücretsizdir.</li>
          <li>
            Öğrenci uzmanlar sizden hiçbir ad altında (ücret, bağış, hediye vb.) ödeme isteyemez.
          </li>
          <li>
            Böyle bir istekle karşılaşırsanız sohbet ekranındaki şikâyet düğmesiyle bildirin.
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="Staj modeli: neler belli, neler belli değil?">
        <p>
          Görüşmelerin, öğrencinin staj sürecinin bir parçası olarak yapılması amaçlanmaktadır.{" "}
          <OnayGerekir />
        </p>
        <p>Aşağıdaki konular <strong>henüz netleşmemiştir</strong>:</p>
        <ul className={listeSinifi}>
          <li>
            Görüşmelerin bir öğretim elemanı veya lisanslı uzman gözetiminde (süpervizyon) yapılıp
            yapılmayacağı. <OnayGerekir />
          </li>
          <li>
            Üniversitelerin veya ilgili kurumların bu modeli onaylayıp onaylamadığı. <OnayGerekir />
          </li>
          <li>
            Bu görüşmelerin resmî staj olarak sayılıp sayılmayacağı. <OnayGerekir />
          </li>
          <li>
            Süpervizyon olursa, görüşmeyle ilgili bilgilerin süpervizörle hangi koşullarda
            paylaşılacağı. <OnayGerekir />
          </li>
        </ul>
        <p>Bu konular netleşene kadar yukarıdakileri bir güvence olarak değerlendirmeyin.</p>
      </Bolum>

      <Bolum baslik="Belgeler nasıl kontrol ediliyor?">
        <p>
          Öğrenci uzmanlardan e-Devlet onaylı öğrenci belgesi istenir. Site yöneticisi belgeyi
          inceler ve geçerlilik tarihini kaydeder. Belgenin süresi dolduğunda yenilenmesi istenir.
        </p>
      </Bolum>

      <Bolum baslik="Öğrenci uzmanlar neleri yapamaz?">
        <ul className={listeSinifi}>
          <li>Tanı koyamaz. <OnayGerekir /></li>
          <li>İlaç öneremez. <OnayGerekir /></li>
          <li>Rapor veya resmî belge düzenleyemez. <OnayGerekir /></li>
        </ul>
      </Bolum>

      <Bolum baslik="Kimler için uygun değildir?">
        <ul className={listeSinifi}>
          <li>
            Kendinize veya bir başkasına zarar verme düşünceniz varsa ya da acil bir durumdaysanız:
            hemen{" "}
            <a href="tel:112" className="font-semibold underline">
              112
            </a>
            &apos;yi arayın.
          </li>
          <li>
            Tanı veya tedavi gerektiren durumlarda lisanslı bir uzmana ya da bir sağlık kuruluşuna
            başvurun.
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="Gizlilik">
        <p>
          Öğrenci uzmanlarla yapılan mesajlaşmalar da diğer sohbetler gibi şifreli saklanır.
          Ayrıntılar{" "}
          <Link href="/gizlilik" className="text-teal-800 underline">
            Gizlilik Politikası
          </Link>
          &apos;nda.
        </p>
      </Bolum>
    </YasalSayfa>
  );
}
