import { OnayGerekir } from "@/components/OnayGerekir";
import { ACIK_RIZA_SURUMU, KVKK_SURUMU } from "@/lib/sabitler";

// TASLAK METINLER: Yayindan once avukat tarafindan hazirlanmali/onaylanmalidir.
// Metni degistirirseniz src/lib/sabitler.ts icindeki surum numarasini da degistirin.

const baslik = "pt-2 text-base font-semibold text-slate-900";

export function AydinlatmaMetni() {
  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p className="text-xs text-slate-500">Sürüm: {KVKK_SURUMU}</p>

      <h3 className={baslik}>1. Veri sorumlusu</h3>
      <p>
        [Veri sorumlusunun adı/unvanı ve iletişim adresi buraya yazılacak.] Bu site bir öğrenci
        projesidir.
      </p>

      <h3 className={baslik}>2. Hangi kişisel verileri işliyoruz?</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Kimlik ve iletişim: ad soyad, e-posta adresi.</li>
        <li>Hesap bilgileri: hesap türü, onay kayıtları (tarih, saat ve metin sürümü).</li>
        <li>Uzmanlar için: unvan veya bölüm, yüklenen belgeler ve profil fotoğrafı.</li>
        <li>Başvurular: seçilen konu (isteğe bağlı) ve seçilen tarih ve saat.</li>
        <li>
          Seans kayıtları: seansın tarihi, saati, süresi, ücreti, durumu ve görüşme bağlantısı. Bir uzmanla seans
          yaptığınız bilgisi hassas olabilir; analitik araçlarına veya kayıt dosyalarına yazılmaz.
        </li>
        <li>Demo ödeme kayıtları: tutar, komisyon ve durum. Kart bilgisi alınmaz, para çekilmez.</li>
        <li>
          Grup seansları: katıldığınız seans ve katılım durumu. Seansın konusu sağlık veya psikolojik duruma ilişkin bilgi
          verebilir. Adınızı yalnızca grubun uzmanı görür, diğer katılımcılar görmez.
        </li>
        <li>
          Mesajlar: danışan ile uzman arasındaki yazışmalar. Mesajlar sağlık ve psikolojik
          duruma ilişkin <strong>özel nitelikli kişisel veri</strong> içerebilir.
        </li>
      </ul>

      <h3 className={baslik}>3. Hangi amaçlarla ve hangi hukuki sebeplerle?</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Üyelik ve hizmetin sunulması: sözleşmenin kurulması ve ifası (KVKK m. 5/2-c).</li>
        <li>Uzman belgelerinin doğrulanması: meşru menfaat (KVKK m. 5/2-f).</li>
        <li>
          Güvenlik ve kötüye kullanımın önlenmesi (şikâyet edilen veya riskli görülen sohbetlerin
          incelenmesi dahil): meşru menfaat (KVKK m. 5/2-f). Mesajlardaki özel nitelikli veriler
          için açık rızanız.
        </li>
        <li>Mesajlardaki özel nitelikli veriler: açık rızanız (KVKK m. 6).</li>
      </ul>

      <h3 className={baslik}>4. Verileri kimler görebilir?</h3>
      <p>
        Mesajlarınızı <strong>varsayılan olarak yalnızca konuşmanın iki tarafı</strong> görür. Site
        yöneticisi sohbetleri normalde göremez.
      </p>
      <p>
        <strong>
          Güvenlik ve kötüye kullanımın önlenmesi amacıyla, şikâyet edilen veya riskli görülen
          sohbetler yetkili yönetici tarafından incelenebilir.
        </strong>{" "}
        Bir sohbet; taraflardan birinin şikâyeti, yöneticinin gerekçeli inceleme kararı veya ileride
        kullanılabilecek otomatik risk tespiti ile işaretlenebilir. Yönetici işaretli bir sohbeti
        yalnızca sebep yazarak ve sınırlı bir süre için açabilir. Her erişim; yöneticinin kimliği,
        tarih/saat, sohbet ve sebep bilgisiyle değiştirilemeyen bir kayda yazılır.
      </p>
      <p>
        Site dışına ödeme yönlendirmesini önlemek için <strong>bağımsız uzmanların yazdığı mesajlar</strong>,
        gönderilirken ve şifrelenmeden hemen önce bir bilgisayar programı tarafından IBAN ve telefon numarası
        kalıpları açısından kontrol edilir. Kalıp bulunursa sohbet incelemeye işaretlenir. Mesaj engellenmez, karşı
        tarafa bildirim gitmez ve bulunan metin ayrıca kaydedilmez. Danışan mesajları ve öğrenci uzman sohbetleri
        kontrol edilmez. <OnayGerekir />
      </p>
      <p>
        Seans ve demo ödeme kayıtlarını konuşmanın iki tarafı görür. &quot;Seans yapılmadı&quot; bildiriminde yönetici
        yalnızca seansın tarihini, tutarını ve bağlantı eklenip eklenmediğini görür.
      </p>
      <p>Uzman belgelerini yalnızca site yöneticisi görür.</p>
      <p>
        Uzmanın paylaştığı görüntülü görüşme bağlantısını kullanırsanız görüşme, bağlantının ait olduğu
        üçüncü taraf serviste (Google Meet, Zoom veya Microsoft Teams) yapılır. Bu görüşme sitemizde
        kaydedilmez ve o servisin gizlilik kuralları geçerlidir.
      </p>

      <h3 className={baslik}>5. Veriler nerede saklanıyor? (Yurt dışına aktarım)</h3>
      <p>
        Veriler, hizmet sağlayıcılarımızın Almanya&apos;nın Frankfurt şehrindeki sunucularında
        saklanır. Bu, KVKK m. 9 kapsamında yurt dışına aktarımdır. Mesajlar sunucuda şifreli
        olarak tutulur.
      </p>

      <h3 className={baslik}>6. Ne kadar süre saklanıyor?</h3>
      <p>
        [Saklama süreleri burada netleştirilecek.] Uzman belgeleri, yönetici kararından sonra
        silinir. Hesabınızı sildiğinizde verileriniz, kanunen saklanması gerekenler dışında silinir.
      </p>
      <p>
        Bir uzmana verdiğiniz yıldız puanı (1-5) uzmanın hesabı durdukça saklanır ve sitede yalnızca ortalama olarak
        gösterilir. Hesabınızı silerseniz puan silinmez; sizinle bağı koparılarak adsız olarak kalır.
      </p>
      <p>
        Seans ve demo ödeme kayıtları sohbetle birlikte silinir. Sohbet daha uzun süre durursa seansın bitiminden 12
        ay sonra otomatik silinir. Açık bir inceleme varsa işlem sonuçlanana kadar silinmez.
      </p>
      <p>
        Bir uzman hesabını silerse uzmanın adı ve kimliği silinir. Sohbet ve uzmanın mesajları, danışan
        erişebilsin diye salt okunur olarak en fazla 6 ay saklanır; sonra otomatik silinir. Danışan bu
        sohbeti daha önce silebilir. Açık bir şikayet veya inceleme varsa sohbet işlem sonuçlanana kadar
        silinmez.
      </p>

      <h3 className={baslik}>7. Haklarınız (KVKK m. 11)</h3>
      <p>
        Verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini veya silinmesini
        isteme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı
        [iletişim adresi] üzerinden yapabilirsiniz.
      </p>
    </div>
  );
}

export function AcikRizaMetni() {
  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p className="text-xs text-slate-500">Sürüm: {ACIK_RIZA_SURUMU}</p>
      <p>
        Aydınlatma metnini okudum. Mesajlarımın varsayılan olarak yalnızca konuşmanın iki tarafınca
        okunabildiğini biliyorum. Uzmanla mesajlaşırken paylaşacağım{" "}
        <strong>sağlık ve psikolojik durumuma ilişkin özel nitelikli kişisel verilerimin</strong>:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>danışmanlık hizmeti kapsamında uzmanla iletişim kurmak amacıyla işlenmesine,</li>
        <li>şifreli olarak Almanya&apos;daki (Frankfurt) sunucularda saklanmasına ve oraya aktarılmasına,</li>
        <li>
          güvenlik ve kötüye kullanımın önlenmesi amacıyla, sohbetin şikâyet edilmesi veya riskli
          görülmesi durumunda yetkili yönetici tarafından sebep belirtilerek ve erişim kaydı
          tutularak incelenebilmesine,
        </li>
        <li>
          bağımsız uzmanların yazdığı mesajların, site dışına ödeme yönlendirmesini önlemek amacıyla gönderilirken
          bir bilgisayar programı tarafından IBAN ve telefon numarası kalıpları açısından kontrol edilmesine,
        </li>
        <li>
          uzmanın hesabını silmesi durumunda sohbetin, uzmanın adı olmadan danışanda salt okunur olarak en
          fazla 6 ay daha saklanmasına
        </li>
      </ul>
      <p>açık rıza veriyorum.</p>
      <p className="text-slate-500">
        Rızanızı vermek zorunda değilsiniz. Ancak rıza vermeden mesajlaşma özelliğini kullanamazsınız.
        Rızanızı dilediğiniz zaman [iletişim adresi] üzerinden geri alabilirsiniz.
      </p>
    </div>
  );
}
