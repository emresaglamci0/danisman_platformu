import Link from "next/link";
import { OnayGerekir } from "@/components/OnayGerekir";
import { Bolum, listeSinifi, YasalSayfa } from "@/components/YasalSayfa";
import { ILETISIM_EPOSTASI, YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "Kullanım Koşulları | Danışman Buluşma" };

export default function KullanimKosullariSayfasi() {
  return (
    <YasalSayfa baslik="Kullanım Koşulları" guncelleme={YASAL_METIN_TARIHI}>
      <Bolum baslik="1. Taraflar ve kapsam">
        <p>
          Bu koşullar, [platform işletmecisinin adı/unvanı] ile siteyi kullanan herkes arasındaki
          kuralları belirler. Siteyi kullanarak bu koşulları kabul etmiş olursunuz. Bu site bir
          öğrenci projesidir. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="2. Platformun rolü">
        <p>
          Platform, danışanlar ile psikolog, psikolojik danışman ve öğrenci uzmanları buluşturan bir
          aracıdır. Platformun kendisi psikolojik danışmanlık, tanı veya tedavi hizmeti vermez.
          Görüşmenin içeriğinden görüşmeyi yapan uzman sorumludur. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="3. Acil durumlar">
        <p>
          <strong>Bu platform acil durum hizmeti değildir.</strong> Uzmanlar mesajlara hemen yanıt
          veremeyebilir. Hayati tehlike varsa veya kendinize ya da bir başkasına zarar verme
          düşünceniz varsa hemen <a href="tel:112" className="font-semibold underline">112</a>
          &apos;yi arayın.
        </p>
      </Bolum>

      <Bolum baslik="4. Hesap">
        <ul className={listeSinifi}>
          <li>
            Siteyi kullanmak için 18 yaşını doldurmuş olmanız gerekir. <OnayGerekir />
          </li>
          <li>Kayıt sırasında doğru bilgi vermeli ve şifrenizi kimseyle paylaşmamalısınız.</li>
          <li>Başka biri adına hesap açamazsınız. Yönetici hesabı kayıt formundan açılamaz.</li>
        </ul>
      </Bolum>

      <Bolum baslik="5. Uzmanlar ve öğrenci uzmanlar">
        <ul className={listeSinifi}>
          <li>
            Uzmanların yüklediği belgeler, profil yayınlanmadan önce site yöneticisi tarafından
            kontrol edilir. Bu kontrol, uzmanın her görüşmesinin denetlendiği anlamına gelmez.{" "}
            <OnayGerekir />
          </li>
          <li>Sahte veya başkasına ait belge yükleyen hesaplar kapatılır.</li>
          <li>
            Öğrenci uzmanlar lisanslı uzman değildir ve görüşmeleri <strong>ücretsiz</strong> yapar.
            Ayrıntılar için{" "}
            <Link href="/ogrenci-uzmanlar/hakkinda" className="text-teal-800 underline">
              Öğrenci Uzmanlar Hakkında
            </Link>{" "}
            sayfasına bakın.
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="6. Ücretler">
        <ul className={listeSinifi}>
          <li>
            Öğrenci uzmanlarla yapılan görüşmeler ücretsizdir. Öğrenci uzmanlar hiçbir ad altında
            (ücret, bağış, hediye vb.) ödeme isteyemez. Böyle bir istek olursa sohbet ekranındaki
            şikâyet düğmesiyle bildirin.
          </li>
          <li>
            Bağımsız uzmanlar her seans için tarih, saat ve ücret içeren bir plan yollar. Site içindeki ödeme
            şu anda <strong>demodur</strong>: para çekilmez, kart bilgisi istenmez. Gerçek ödeme açıldığında
            koşullar ve platformun alacağı hizmet bedeli ayrıca duyurulacaktır. <OnayGerekir />
          </li>
          <li>
            Seansa 24 saatten fazla varsa danışan veya uzman iptal edebilir, ödeme iade edilir. 24 saatten az
            kaldıysa danışan iptal ederse iade yapılmaz, uzman iptal ederse iade yapılır. Ödeme, seans bitiminden 48
            saat sonrasına kadar bekletilir; bu sürede danışan &quot;Seans yapılmadı&quot; diyebilir ve kararı yönetici
            verir. <OnayGerekir />
          </li>
          <li>
            Grup seansları yalnızca bağımsız uzmanlar tarafından açılır ve en az 3, en fazla 12 kişiyle yapılır. Yer,
            önceden ödeme yapılınca ayrılır. Seansa 12 saat kala 3 kişi olmazsa veya sonradan 3 kişinin altına düşerse
            seans iptal edilir ve ödemeler iade edilir; 24 saatten az kala ayrılan kişiye iade yapılmaz. <OnayGerekir />
          </li>
          <li>
            Puan verebilmek için danışan olmanız ve aynı bağımsız uzmanla en az 2 tamamlanmış, ücretli seans
            yapmış olmanız gerekir. Puan 1 ile 5 yıldız arasındadır, yazılı yorum alınmaz. Öğrenci uzmanlar
            puanlanmaz. Puanı sonradan değiştirebilirsiniz. Puanınız adsız gösterilir ve hesabınızı silseniz de
            adsız olarak kalır. Gerçeğe aykırı veya karşılıklı çıkara dayalı puan
            vermek yasaktır. <OnayGerekir />
          </li>
          <li>
            Yüz yüze görüşmeler ve ödemeleri site dışındadır, iade ve koruma kapsamında değildir. Bir uzmanın sizi
            site dışında ödemeye yönlendirmesini şikâyet edebilirsiniz; kanıt varsa uzmanın hesabı kapatılır.{" "}
            <OnayGerekir />
          </li>
        </ul>
      </Bolum>

      <Bolum baslik="7. Yasak davranışlar">
        <ul className={listeSinifi}>
          <li>Taciz, hakaret, tehdit veya ayrımcı ifadeler</li>
          <li>Reklam, spam veya başka sitelere yönlendirme</li>
          <li>Siteyi bozmaya, başkalarının hesaplarına veya verilerine erişmeye çalışmak</li>
          <li>Öğrenci uzmanların ücret istemesi veya kabul etmesi</li>
        </ul>
      </Bolum>

      <Bolum baslik="8. Şikâyet ve inceleme">
        <p>
          Bir sohbeti, sohbet ekranındaki şikâyet düğmesiyle bildirebilirsiniz. Şikâyet edilen bir
          sohbeti yetkili yönetici, sebep yazarak ve sınırlı bir süre için inceleyebilir. Her erişim
          kayda geçer. Ayrıntılar{" "}
          <Link href="/kvkk" className="text-teal-800 underline">
            KVKK Aydınlatma Metni
          </Link>
          &apos;nde yazar.
        </p>
      </Bolum>

      <Bolum baslik="9. Hesabın kapatılması">
        <p>
          Hesabınızı panelinizdeki &quot;Hesabımı sil&quot; bölümünden silebilirsiniz. Sorun yaşarsanız{" "}
          <a href={`mailto:${ILETISIM_EPOSTASI}`} className="text-teal-800 underline">{ILETISIM_EPOSTASI}</a>{" "}
          adresine yazabilirsiniz. Bu koşulları ihlal eden hesaplar uyarı yapılarak veya
          yapılmadan kapatılabilir. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="10. Sorumluluğun sınırı">
        <p>
          [Platformun hangi durumlarda sorumlu olmadığı avukat tarafından yazılacak.] <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="11. Değişiklikler">
        <p>
          Bu koşullar değişebilir. Değişiklikler bu sayfada yayınlanır ve sayfanın başındaki tarih
          güncellenir.
        </p>
      </Bolum>

      <Bolum baslik="12. Uygulanacak hukuk">
        <p>
          Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. Uyuşmazlıklarda [yetkili mahkeme ve
          icra daireleri] yetkilidir. <OnayGerekir />
        </p>
      </Bolum>
    </YasalSayfa>
  );
}
