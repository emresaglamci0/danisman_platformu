import Link from "next/link";
import { OnayGerekir } from "@/components/OnayGerekir";
import { Bolum, listeSinifi, YasalSayfa } from "@/components/YasalSayfa";
import { YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "Hakkımızda | Danışman Buluşma" };

export default function HakkimizdaSayfasi() {
  return (
    <YasalSayfa baslik="Hakkımızda" guncelleme={YASAL_METIN_TARIHI}>
      <Bolum baslik="Biz kimiz?">
        <p>
          Danışman Buluşma bir öğrenci projesidir. [Proje sahibi veya şirket hakkında kısa bilgi
          buraya yazılacak.]
        </p>
        <p className="rounded-lg bg-slate-100 px-3 py-2">
          Şu an sitede gösterilen uzmanlar <strong>uydurma test verisidir</strong>. Site henüz gerçek
          danışmanlık hizmeti sunmamaktadır.
        </p>
      </Bolum>

      <Bolum baslik="Amacımız">
        <p>
          Destek almak isteyen kişilerin, belgeleri kontrol edilmiş psikolog ve psikolojik
          danışmanlara ya da ücretsiz görüşme yapan PDR 4. sınıf ve Klinik Psikoloji yüksek lisans
          öğrencilerine kolayca ve gizliliklerini koruyarak ulaşmasını sağlamak. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="Uzmanları nasıl kontrol ediyoruz?">
        <ul className={listeSinifi}>
          <li>
            Psikolog ve psikolojik danışmanlardan barkodlu e-Devlet YÖK mezun belgesi veya diploma
            istenir.
          </li>
          <li>Öğrenci uzmanlardan e-Devlet onaylı öğrenci belgesi istenir ve belgenin geçerlilik tarihi takip edilir.</li>
          <li>Belgeleri site yöneticisi tek tek inceler. Karardan sonra belge dosyaları silinir.</li>
        </ul>
        <p>
          Belge kontrolü, kişinin mesleki yeterliliğini veya her görüşmenin kalitesini garanti
          etmez. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="İlkelerimiz">
        <ul className={listeSinifi}>
          <li>Yalnızca gerekli bilgiyi istemek</li>
          <li>Mesajları şifreli saklamak ve varsayılan olarak yalnızca iki tarafa göstermek</li>
          <li>
            Öğrenci uzmanlarla görüşmeleri ücretsiz tutmak (
            <Link href="/ogrenci-uzmanlar/hakkinda" className="text-teal-800 underline">
              ayrıntılar
            </Link>
            )
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="Ne değiliz?">
        <p>
          Bu site bir hastane, klinik veya acil durum hizmeti değildir. Acil bir durumda hemen{" "}
          <a href="tel:112" className="font-semibold underline">
            112
          </a>
          &apos;yi arayın.
        </p>
      </Bolum>
    </YasalSayfa>
  );
}
