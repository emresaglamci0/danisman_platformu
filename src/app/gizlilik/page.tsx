import Link from "next/link";
import { OnayGerekir } from "@/components/OnayGerekir";
import { Bolum, listeSinifi, YasalSayfa } from "@/components/YasalSayfa";
import { ILETISIM_EPOSTASI, YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "Gizlilik Politikası | Danışman Buluşma" };

// Bu sayfa sade bir ozettir. Hukuki ayrintilar KVKK aydinlatma metnindedir; ikisi celismemeli.
export default function GizlilikSayfasi() {
  return (
    <YasalSayfa baslik="Gizlilik Politikası" guncelleme={YASAL_METIN_TARIHI}>
      <p>
        Bu sayfa, verilerinizi nasıl koruduğumuzu sade bir dille özetler. Hukuki ayrıntılar ve
        haklarınız için{" "}
        <Link href="/kvkk" className="text-teal-800 underline">
          KVKK Aydınlatma Metni
        </Link>
        &apos;ni okuyun. İki metin arasında fark olursa KVKK Aydınlatma Metni geçerlidir.
      </p>

      <Bolum baslik="Yalnızca gerekli bilgiyi istiyoruz">
        <ul className={listeSinifi}>
          <li>Hesap: ad soyad, e-posta ve şifre. Şifreniz geri çözülemeyecek şekilde saklanır; biz de göremeyiz.</li>
          <li>
            Başvuru: yalnızca listeden seçtiğiniz konu (isteğe bağlı) ve uygun zaman. Sorununuzu
            yazmanız istenmez.
          </li>
          <li>
            Uzmanlar: unvan veya bölüm, belgeler ve profil fotoğrafı. Fotoğraflardaki konum gibi
            gizli bilgiler silinir.
          </li>
          <li>TC kimlik numarası, açık adres veya sağlık geçmişi istemiyoruz.</li>
        </ul>
      </Bolum>

      <Bolum baslik="Mesajlarınız">
        <ul className={listeSinifi}>
          <li>Mesajlar sunucuda şifreli olarak saklanır.</li>
          <li>Varsayılan olarak yalnızca konuşmanın iki tarafı mesajları okuyabilir.</li>
          <li>
            Bir sohbet şikâyet edilirse yetkili yönetici, sebep yazarak ve 30 dakikalığına o sohbeti
            açabilir. Her erişim silinemeyen bir kayda yazılır.
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="Uzman belgeleri">
        <p>
          Belgeleri yalnızca site yöneticisi görür. Yönetici onay veya ret kararını verdikten sonra
          belge dosyaları silinir.
        </p>
      </Bolum>

      <Bolum baslik="Verilerinizi kimlerle paylaşıyoruz?">
        <ul className={listeSinifi}>
          <li>Verilerinizi satmıyoruz ve reklam için kullanmıyoruz.</li>
          <li>
            Veriler, hizmet sağlayıcımız Supabase&apos;in Almanya&apos;daki (Frankfurt) sunucularında
            saklanır.
          </li>
          <li>
            Kanunen zorunlu olduğunda yetkili kamu kurumlarıyla paylaşılabilir. <OnayGerekir />
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="Çerezler ve takip">
        <p>
          Yalnızca giriş yapabilmeniz için gereken çerezleri kullanıyoruz. Analitik, reklam veya
          sosyal medya takibi yok. Ayrıntılar{" "}
          <Link href="/cerezler" className="text-teal-800 underline">
            Çerez Bildirimi
          </Link>{" "}
          sayfasında.
        </p>
      </Bolum>

      <Bolum baslik="Güvenlik">
        <p>
          Tüm bağlantılar şifrelidir (HTTPS). Yönetici hesapları iki adımlı doğrulama ile korunur.
          Hiçbir sistem tamamen risksiz değildir; bir güvenlik ihlali olursa kanunun öngördüğü
          şekilde bildirim yapılır. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="Saklama ve silme">
        <p>
          [Saklama süreleri burada netleştirilecek.] <OnayGerekir /> Hesabınızın ve verilerinizin
          silinmesini şimdilik{" "}
          <a href={`mailto:${ILETISIM_EPOSTASI}`} className="text-teal-800 underline">
            {ILETISIM_EPOSTASI}
          </a>{" "}
          adresine yazarak isteyebilirsiniz.
        </p>
      </Bolum>
    </YasalSayfa>
  );
}
